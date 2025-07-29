import {
  BlockCompletion,
  IBlockCompletionOptions,
} from './completion-for/completion-blocks.interface';
import {
  CompileOptCompletion,
  ICompileOptCompletionOptions,
} from './completion-for/completion-compile-opts.interface';
import {
  ExecutiveCommandCompletion,
  IExecutiveCommandCompletionOptions,
} from './completion-for/completion-executive-commands.interface';
import {
  FunctionMethodCompletion,
  IFunctionMethodCompletionOptions,
} from './completion-for/completion-function-methods.interface';
import {
  FunctionCompletion,
  IFunctionCompletionOptions,
} from './completion-for/completion-functions.interface';
import {
  IIncludeCompletionOptions,
  IncludeCompletion,
} from './completion-for/completion-include.interface';
import {
  IKeywordCompletionOptions,
  KeywordCompletion,
} from './completion-for/completion-keyword.interface';
import {
  IProcedureMethodCompletionOptions,
  ProcedureMethodCompletion,
} from './completion-for/completion-procedure-methods.interface';
import {
  IProcedureCompletionOptions,
  ProcedureCompletion,
} from './completion-for/completion-procedures.interface';
import {
  IPropertyCompletionOptions,
  PropertyCompletion,
} from './completion-for/completion-properties.interface';
import {
  IPropertyInStructureCompletionOptions,
  PropertyInStructureCompletion,
} from './completion-for/completion-properties-in-structures.interface';
import {
  ISpecialFunctionCompletionOptions,
  SpecialFunctionCompletion,
} from './completion-for/completion-special-functions.interface';
import {
  ISpecialProcedureCompletionOptions,
  SpecialProcedureCompletion,
} from './completion-for/completion-special-procedures.interface';
import {
  IStructureNameCompletionOptions,
  StructureNameCompletion,
} from './completion-for/completion-structure-names.interface';
import {
  ISystemVariableCompletionOptions,
  SystemVariableCompletion,
} from './completion-for/completion-system-variables.interface';
import {
  IVariableCompletionOptions,
  VariableCompletion,
} from './completion-for/completion-variables.interface';

/**
 * Types of auto-complete
 */
export type AutoCompleteType =
  | BlockCompletion
  | CompileOptCompletion
  | ExecutiveCommandCompletion
  | FunctionCompletion
  | FunctionMethodCompletion
  | IncludeCompletion
  | KeywordCompletion
  | ProcedureCompletion
  | ProcedureMethodCompletion
  | PropertyCompletion
  | PropertyInStructureCompletion
  | SpecialFunctionCompletion
  | SpecialProcedureCompletion
  | StructureNameCompletion
  | SystemVariableCompletion
  | VariableCompletion;

/**
 * Options passed to auto-complete
 */
export type AutoCompleteRecipeOptions<T extends AutoCompleteType> =
  T extends BlockCompletion
    ? IBlockCompletionOptions
    : T extends CompileOptCompletion
    ? ICompileOptCompletionOptions
    : T extends ExecutiveCommandCompletion
    ? IExecutiveCommandCompletionOptions
    : T extends FunctionMethodCompletion
    ? IFunctionMethodCompletionOptions
    : T extends FunctionCompletion
    ? IFunctionCompletionOptions
    : T extends IncludeCompletion
    ? IIncludeCompletionOptions
    : T extends KeywordCompletion
    ? IKeywordCompletionOptions
    : T extends ProcedureCompletion
    ? IProcedureCompletionOptions
    : T extends ProcedureMethodCompletion
    ? IProcedureMethodCompletionOptions
    : T extends PropertyCompletion
    ? IPropertyCompletionOptions
    : T extends PropertyInStructureCompletion
    ? IPropertyInStructureCompletionOptions
    : T extends SpecialFunctionCompletion
    ? ISpecialFunctionCompletionOptions
    : T extends SpecialProcedureCompletion
    ? ISpecialProcedureCompletionOptions
    : T extends StructureNameCompletion
    ? IStructureNameCompletionOptions
    : T extends SystemVariableCompletion
    ? ISystemVariableCompletionOptions
    : T extends VariableCompletion
    ? IVariableCompletionOptions
    : never;

/**
 * Recipe to describe auto-completion parameters
 */
export type AutoCompleteRecipe<T extends AutoCompleteType> = {
  /** Type of auto-complete */
  type: T;
  /** Options to add auto-complete values */
  options: AutoCompleteRecipeOptions<T>;
};

/**
 * Strictly typed lookup for completion types
 */
interface IAutoCompleteTypeLookup {
  BLOCK: BlockCompletion;
  COMPILE_OPT: CompileOptCompletion;
  EXECUTIVE_COMMAND: ExecutiveCommandCompletion;
  FUNCTION: FunctionCompletion;
  FUNCTION_METHOD: FunctionMethodCompletion;
  INCLUDE: IncludeCompletion;
  KEYWORD: KeywordCompletion;
  PROCEDURE: ProcedureCompletion;
  PROCEDURE_METHOD: ProcedureMethodCompletion;
  PROPERTY: PropertyCompletion;
  PROPERTY_IN_STRUCTURE: PropertyInStructureCompletion;
  SPECIAL_FUNCTION: SpecialFunctionCompletion;
  SPECIAL_PROCEDURE: SpecialProcedureCompletion;
  STRUCTURE_NAME: StructureNameCompletion;
  SYSTEM_VARIABLE: SystemVariableCompletion;
  VARIABLE: VariableCompletion;
}

/**
 * Lookup of all types of auto-complete
 */
export const AUTO_COMPLETE_TYPE_LOOKUP: IAutoCompleteTypeLookup = {
  BLOCK: 'blocks',
  COMPILE_OPT: 'compile-opt',
  EXECUTIVE_COMMAND: 'executive-command',
  FUNCTION: 'function',
  FUNCTION_METHOD: 'function-method',
  INCLUDE: 'include',
  KEYWORD: 'keyword',
  PROCEDURE: 'procedure',
  PROCEDURE_METHOD: 'procedure-method',
  PROPERTY: 'property',
  PROPERTY_IN_STRUCTURE: 'property-in-structure',
  SPECIAL_FUNCTION: 'special-function',
  SPECIAL_PROCEDURE: 'special-procedure',
  STRUCTURE_NAME: 'structure-name',
  SYSTEM_VARIABLE: 'system-variable',
  VARIABLE: 'variable',
};
