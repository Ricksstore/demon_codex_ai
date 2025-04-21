import { TaskAssembler } from '@idl/assembler';
import { FormatterType, IAssemblerInputOptions } from '@idl/assembling/config';
import { IDLFileHelper } from '@idl/idl/files';
import { LoadTask } from '@idl/schemas/tasks';
import { LSP_WORKER_THREAD_MESSAGE_LOOKUP } from '@idl/workers/parsing';

import { IDL_INDEX } from '../events/initialize-document-manager';
import { GetFormattingConfigForFile } from './get-formatting-config-for-file';
import { IResolvedFSPathAndCodeForURI } from './resolve-fspath-and-code-for-uri.interface';

/**
 * Formats a file in the language server
 */
export async function FormatFile(
  info: IResolvedFSPathAndCodeForURI,
  formatting?: Partial<IAssemblerInputOptions<FormatterType>>
): Promise<string | undefined> {
  // return if nothing found
  if (info === undefined) {
    return undefined;
  }

  /**
   * Get formatting config
   */
  const config = GetFormattingConfigForFile(info.fsPath, formatting);

  /**
   * Formatted code
   */
  let formatted: string;

  /**
   * Apply correct formatter
   */
  switch (true) {
    /**
     * Handle task files and manually handle errors from loading tasks
     */
    case IDLFileHelper.isTaskFile(info.fsPath): {
      formatted = TaskAssembler(await LoadTask(info.fsPath, info.code), config);
      break;
    }
    /**
     * Handle PRO code
     */
    case IDLFileHelper.isPROCode(info.fsPath) ||
      IDLFileHelper.isIDLNotebookFile(info.fsPath) ||
      IDLFileHelper.isPRODef(info.fsPath): {
      formatted = await IDL_INDEX.indexerPool.workerio.postAndReceiveMessage(
        IDL_INDEX.getWorkerID(info.fsPath),
        LSP_WORKER_THREAD_MESSAGE_LOOKUP.ASSEMBLE_PRO_CODE,
        { file: info.fsPath, code: info.code, formatting: config }
      ).response;
      break;
    }
    default:
      return undefined;
  }

  // return result
  return formatted;
}
