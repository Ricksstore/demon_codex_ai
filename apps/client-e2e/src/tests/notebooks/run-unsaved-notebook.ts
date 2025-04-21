import {
  IDL_COMMANDS,
  IDL_NOTEBOOK_LANGUAGE_NAME,
  Sleep,
} from '@idl/shared/extension';
import { VSCODE_COMMANDS } from '@idl/types/vscode';
import expect from 'expect';
import * as vscode from 'vscode';

import { CLIENT_E2E_CONFIG } from '../client-e2e-config.interface';
import { RunnerFunction } from '../runner.interface';
import { CompareCellOutputs } from './helpers/compare-cells';
import { ICompareCellOutputs } from './helpers/compare-cells.interface';

/**
 * Types of outputs from cells that we expect to have
 */
export const CELL_OUTPUT: ICompareCellOutputs[] = [
  {
    idx: 1,
    success: true,
    mimeTypes: ['text/plain'],
  },
];

/**
 * Opens a new IDL notebook, adds a code cell, and makes sure we can run it
 * without any issues considering it hasnt been saved to disk
 */
export const RunUnsavedNotebook: RunnerFunction = async (init) => {
  /** Get reference to the notebook controller */
  const controller = init.notebooks.controller;

  // make new notebook
  await vscode.commands.executeCommand(
    IDL_COMMANDS.NOTEBOOKS.NEW_NOTEBOOK,
    true
  );

  // short pause
  await Sleep(CLIENT_E2E_CONFIG.DELAYS.PROBLEMS_NOTEBOOK);

  // get active editor
  const editor = vscode.window.activeNotebookEditor;

  // make sure we have an IDL Notebook as our editor
  expect(editor?.notebook?.notebookType).toEqual(IDL_NOTEBOOK_LANGUAGE_NAME);

  /** Get reference to the current notebook */
  const nb = editor.notebook;

  // start IDL if it hasnt yet
  if (!controller.isStarted(nb)) {
    await controller.launchIDL(nb, 'Launching IDL');
  }

  // make sure launched
  expect(controller.isStarted(nb)).toBeTruthy();

  // update text
  const cells = nb.getCells();

  // verify we have two cells
  expect(cells.length).toEqual(2);

  // run all cells
  await vscode.commands.executeCommand(VSCODE_COMMANDS.NOTEBOOK_RUN_ALL);

  // short pause based on the number of cells we have
  // sometimes the rendering takes too long to register (like complex maps)
  // so we need an extra pause
  await Sleep(CLIENT_E2E_CONFIG.DELAYS.PROBLEMS_NOTEBOOK);

  // compare cells
  await CompareCellOutputs(nb, CELL_OUTPUT);
};
