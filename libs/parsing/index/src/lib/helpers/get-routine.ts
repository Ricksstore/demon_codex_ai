import { IParsed, TreeToken } from '@idl/parsing/syntax-tree';
import {
  CallFunctionMethodToken,
  CallProcedureMethodToken,
  RoutineMethodNameToken,
  RoutineNameToken,
  TOKEN_NAMES,
  TokenName,
} from '@idl/tokenizer';
import { GLOBAL_TOKEN_TYPES, GlobalIndexedRoutineToken } from '@idl/types/core';

import { IDLIndex } from '../idl-index.class';
import { GetGlobalsFromFunctionCall } from './get-globals-from-function-call';
import { GetGlobalsFromProcedureCall } from './get-globals-from-procedure-call';
import {
  CALL_ROUTINE_TOKENS,
  CallRoutineToken,
} from './get-keywords.interface';
import { GetMethod } from './get-method';
import { ROUTINE_NAME_TOKENS } from './get-routine.interface';
import { ITokenCache } from './token-cache.interface';

/**
 * Gets a routine definition based on the name where it is defined in code
 */
function GetRoutineFromName(
  index: IDLIndex,
  token: TreeToken<RoutineMethodNameToken | RoutineNameToken>
): GlobalIndexedRoutineToken[] {
  // get our parent
  const local = token.scopeTokens[token.scopeTokens.length - 1].name;

  // // return if no local parent
  // if (local === undefined) {
  //   return help;
  // }

  // get the name that we want to match against
  switch (true) {
    // user defined function
    case token.name === TOKEN_NAMES.ROUTINE_NAME &&
      local === TOKEN_NAMES.ROUTINE_FUNCTION:
      return index.findMatchingGlobalToken(
        GLOBAL_TOKEN_TYPES.FUNCTION,
        token.match[0]
      );
    // user defined function method
    case token.name === TOKEN_NAMES.ROUTINE_METHOD_NAME &&
      local === TOKEN_NAMES.ROUTINE_FUNCTION:
      return index.findMatchingGlobalToken(
        GLOBAL_TOKEN_TYPES.FUNCTION_METHOD,
        token.match[0]
      );
    // user defined procedure
    case token.name === TOKEN_NAMES.ROUTINE_NAME &&
      local === TOKEN_NAMES.ROUTINE_PROCEDURE:
      return index.findMatchingGlobalToken(
        GLOBAL_TOKEN_TYPES.PROCEDURE,
        token.match[0]
      );
    // user defined procedure method
    case token.name === TOKEN_NAMES.ROUTINE_METHOD_NAME &&
      local === TOKEN_NAMES.ROUTINE_PROCEDURE:
      return index.findMatchingGlobalToken(
        GLOBAL_TOKEN_TYPES.PROCEDURE_METHOD,
        token.match[0]
      );
    default:
      break;
  }

  return [];
}

/**
 * Given a token that lives within a routine call, or is the call
 * routine token itself, we attempt to find and return the global
 * matching token.
 *
 * This helper contains all the fancy logic to track down a source routine
 * and is the place that edge cases, such as "obj_new()" calls should
 * be handled.
 *
 * Returns all global matches
 */
export function GetRoutine(
  index: IDLIndex,
  parsed: IParsed,
  token: TreeToken<TokenName>,
  useCache = true
): GlobalIndexedRoutineToken[] {
  if ('routine' in (token.cache as ITokenCache) && useCache) {
    return (token.cache as ITokenCache).routine;
  }

  // check for global token first
  let global: GlobalIndexedRoutineToken[] = [];

  /**
   * If we have a routine name, use special logic
   */
  if (token.name in ROUTINE_NAME_TOKENS) {
    global = GetRoutineFromName(
      index,
      token as TreeToken<RoutineMethodNameToken | RoutineNameToken>
    );
    (token.cache as ITokenCache).routine = global;
    return global;
  }

  /**
   * If we have a routine name, use special logic
   */
  if (
    token.scopeTokens[token.scopeTokens.length - 1]?.name in ROUTINE_NAME_TOKENS
  ) {
    global = GetRoutineFromName(
      index,
      token.scopeTokens[token.scopeTokens.length - 1] as TreeToken<
        RoutineMethodNameToken | RoutineNameToken
      >
    );
    (token.cache as ITokenCache).routine = global;
    return global;
  }

  // find the right parent
  let local: CallRoutineToken =
    token.name in CALL_ROUTINE_TOKENS ? (token as CallRoutineToken) : undefined;

  // check if we need to search up our scop eto find a place where keywords
  // could come from
  if (local === undefined) {
    for (let i = token.scopeTokens.length - 1; i > -1; i--) {
      if (token.scopeTokens[i].name in CALL_ROUTINE_TOKENS) {
        local = token.scopeTokens[i] as CallRoutineToken;
        break;
      }
    }

    // return if we didn't find anything
    if (local === undefined) {
      (token.cache as ITokenCache).routine = global;
      return global;
    }
  }

  // figure out what to search our global index by to find help
  switch (local.name) {
    case TOKEN_NAMES.CALL_FUNCTION: {
      global = GetGlobalsFromFunctionCall(index, parsed, local);
      break;
    }
    case TOKEN_NAMES.CALL_FUNCTION_METHOD:
      global = GetMethod(
        index,
        parsed,
        local as TreeToken<CallFunctionMethodToken>,
        useCache
      );
      break;
    case TOKEN_NAMES.CALL_PROCEDURE:
      global = GetGlobalsFromProcedureCall(index, parsed, local);
      break;
    case TOKEN_NAMES.CALL_PROCEDURE_METHOD:
      global = GetMethod(
        index,
        parsed,
        local as TreeToken<CallProcedureMethodToken>,
        useCache
      );
      break;
    // no global tokens, so do nothing
    default:
      break;
  }

  // update cache
  (token.cache as ITokenCache).routine = global;

  // return
  return global;
}
