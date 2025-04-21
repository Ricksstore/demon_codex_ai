import { GetFSPath } from '@idl/idl/files';
import { CodeChecksum } from '@idl/parser';
import { existsSync, readFileSync } from 'fs';

import { DOCUMENT_MANAGER } from '../events/initialize-document-manager';
import { URIFromFSPath } from './uri-from-fspath';

/**
 * Last version of a file that we processed
 */
const CHECKSUM_CACHE: { [key: string]: string } = {};

/**
 * Given a URI for a file, does it match the latest cache and we
 * exclude from processing?
 *
 * Returns true if the cache is the same, otherwise the file has changed
 * and should be processed.
 */
export function CacheValid(uri: string) {
  /**
   * Flag if our cache is valid or not
   */
  let isValid = false;

  /**
   * Get document
   */
  const doc = DOCUMENT_MANAGER.get(uri);

  /**
   * Get path on file system
   */
  const fsPath = GetFSPath(uri);

  try {
    /**
     * Get checksum
     */
    const checksum =
      doc !== undefined
        ? CodeChecksum(doc.getText())
        : CodeChecksum(readFileSync(fsPath, 'utf-8'));

    // see if we have tracked already or not
    if (uri in CHECKSUM_CACHE) {
      isValid = CHECKSUM_CACHE[uri] === checksum;
    }

    // always save latest checksum
    CHECKSUM_CACHE[uri] = checksum;
  } catch (err) {
    // only print the error if the file exists
    if (existsSync(fsPath)) {
      console.warn('Problem trying to validate cache', err);
    }
  }

  return isValid;
}

/**
 * Given a file system path for a file, does it match the latest cache
 * and we exclude it from processing?
 */
export function CacheValidFSPath(fsPath: string) {
  return CacheValid(URIFromFSPath(fsPath).toString());
}
