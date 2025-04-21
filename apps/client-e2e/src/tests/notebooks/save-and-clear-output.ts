import { GetExtensionPath } from '@idl/idl/files';
import { Sleep } from '@idl/shared/extension';
import { VSCODE_COMMANDS } from '@idl/types/vscode';
import { OpenNotebookInVSCode } from '@idl/vscode/shared';
import * as vscode from 'vscode';

import { CLIENT_E2E_CONFIG } from '../client-e2e-config.interface';
import { RunnerFunction } from '../runner.interface';
import { CompareCellOutputs } from './helpers/compare-cells';
import { VerifyEmpty } from './helpers/verify-empty';
import { CELL_OUTPUT } from './run-test-notebook';

/**
 * Function that verifies that we can do basic debugging of IDL sessions
 * and launch a new debugging session.
 */
export const SaveAndClearNotebook: RunnerFunction = async (init) => {
  /**
   * Get the file we are going to open
   */
  const file = GetExtensionPath(
    'idl/test/client-e2e/notebooks/test-notebook.idlnb'
  );

  /**
   * Open the notebook
   */
  const nb = await OpenNotebookInVSCode(file);

  // clear any existing outputs
  await vscode.commands.executeCommand(VSCODE_COMMANDS.NOTEBOOK_RUN_ALL);

  // save contents of notebook
  await nb.save();

  // clear any existing outputs
  await vscode.commands.executeCommand(VSCODE_COMMANDS.CLOSE_EDITOR);

  /**
   * Open the notebook
   */
  const nbAfter = await OpenNotebookInVSCode(file);

  // pause
  await Sleep(CLIENT_E2E_CONFIG.DELAYS.PROBLEMS_NOTEBOOK);

  // compare cells
  await CompareCellOutputs(nbAfter, CELL_OUTPUT, false);

  // clear any existing outputs
  await vscode.commands.executeCommand(VSCODE_COMMANDS.NOTEBOOK_CLEAR_OUTPUTS);

  // pause
  await Sleep(CLIENT_E2E_CONFIG.DELAYS.PROBLEMS_NOTEBOOK);

  // verify that our cells are empty
  VerifyEmpty(nbAfter);

  // save to disk
  await nbAfter.save();
};
