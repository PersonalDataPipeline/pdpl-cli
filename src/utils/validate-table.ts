import Joi, { ValidationError } from "joi";
import { strict as assert } from "node:assert";
import path from "path";
import { readdirSync } from "fs";

import getConfig, { Config } from "./config.js";
import transformations, { PipelineTransforms } from "./transformations.js";
import { KeyVal, OutputHandler, OutputStrategyHandler } from "./types.js";
import { arrayMissingValue } from "./array.js";

interface InputObject {
  [key: string]: {
    [key: string]: KeyVal;
  };
}

export interface OutputHandlerObject {
  name: string;
  handler: OutputStrategyHandler;
  data?: KeyVal;
}

export interface OutputObject {
  strategy: string;
  template: string;
  data?: KeyVal;
}

export interface TableObject {
  version: number;
  input: InputObject;
  output: {
    [key: string]: OutputObject[];
  };
  pipeline: {
    field: string;
    transform?: (keyof PipelineTransforms)[];
    toField?: string;
    linkTo?: string;
    toFieldUpdateIfEmpty?: string;
  }[];
  sources: KeyVal;
  fields: KeyVal;
  handlers: OutputHandlerObject[];
}

export const validateTable = async (
  tableRaw: object,
  config: Config
): Promise<TableObject> => {
  const { value: table, error } = Joi.object({
    version: Joi.number().allow(0.1),
    name: Joi.string(),
    from_table: Joi.string().required(),
    input: Joi.object().pattern(
      Joi.string().valid(...getConfig().inputsSupported),
      Joi.object()
        .pattern(
          Joi.string(),
          Joi.object().pattern(
            Joi.string(),
            Joi.string()
              .pattern(/^[\w_]*$/)
              .invalid("_id")
          )
        )
        .unknown()
    ),
    output: Joi.object().pattern(
      Joi.string().valid(...getConfig().outputsSupported),
      Joi.array().items(
        Joi.object({
          strategy: Joi.string().required(),
          data: Joi.object().unknown(),
        })
      )
    ),
    pipeline: Joi.array().items(
      Joi.object({
        // TODO: Validate that this exists as an input field
        field: Joi.string().required(),
        // TODO: Validate that these exist as built-in or plugin
        transform: Joi.array().items(Joi.string()),
        // TODO: Validate that this exists as an input field
        linkTo: Joi.string(),
        toField: Joi.string(),
        toFieldUpdateIfEmpty: Joi.string(),
      })
    ),
  }).validate(tableRaw) as {
    // TODO: This is not a complete recipe yet
    value: TableObject;
    error: ValidationError;
  };

  if (error) {
    throw new Error(`Recipe validation: ${error.details[0].message}`);
  }

  const allFields: KeyVal = {};
  const msgPrefix = "Recipe validation: ";

  ////
  /// Validate inputs
  //
  table.sources = {};
  const inputNames = Object.keys(table.input);
  for (const inputName of inputNames) {
    const inputObject = table.input[inputName];
    for (const subName in inputObject) {
      const inputFullName = `${inputName}.${subName}`;
      const dataPath = path.join(config.jsonOutputDir, inputName, subName);
      try {
        // TODO: No data should not always throw
        const inputData = readdirSync(dataPath);
        assert(inputData.length >= 1);
      } catch (error) {
        throw new Error(`${msgPrefix}No data found for input ${inputFullName}`);
      }
      table.sources[`${inputFullName}`] = dataPath;

      const existingFields = Object.keys(allFields);
      for (const field of Object.values(inputObject[subName])) {
        if (existingFields.includes(field)) {
          throw new Error(
            `${msgPrefix}Duplicate input field ${field} in ${inputFullName}`
          );
        }
        allFields[field] = inputFullName;
      }
    }
  }

  table.fields = allFields;

  ////
  /// Validate pipeline
  //
  for (const action of table.pipeline || []) {
    const { field, transform, toField, linkTo, toFieldUpdateIfEmpty } = action;

    if (!Object.keys(table.fields).includes(field)) {
      throw new Error(
        `${msgPrefix}Pipeline from field "${field}" does not exist in input data.`
      );
    }

    const maybeMissingTransform = arrayMissingValue(
      Object.keys(transformations),
      transform || []
    );
    if (maybeMissingTransform) {
      throw new Error(
        `${msgPrefix}Unkonwn pipeline transformation "${maybeMissingTransform}."`
      );
    }

    if (toField) {
      if (Object.keys(table.fields).includes(toField)) {
        throw new Error(
          `${msgPrefix}Pipeline to field "${toField}" already exists in input data.`
        );
      }
      table.fields[toField] = table.fields[field];
    }

    if (linkTo) {
      if (!Object.keys(table.fields).includes(linkTo)) {
        throw new Error(
          `${msgPrefix}Pipeline linkTo field "${linkTo}" does not exist in input data.`
        );
      }
      table.fields[`${linkTo}__LINKED`] = table.fields[field];
    }

    if (toFieldUpdateIfEmpty) {
      if (!Object.keys(table.fields).includes(toFieldUpdateIfEmpty)) {
        throw new Error(
          `${msgPrefix}Pipeline toFieldUpdateIfEmpty field "${toFieldUpdateIfEmpty}" does not exist in input data.`
        );
      }
    }
  }

  ////
  /// Validate outputs
  //
  table.handlers = [];
  const outputNames = Object.keys(table.output);
  for (const outputName of outputNames) {
    const { default: outputHandler } = (await import(
      `../outputs/${outputName}/index.js`
    )) as {
      default: OutputHandler;
    };

    if (!outputHandler) {
      throw new Error(`Invalid output handler ${outputName}.`);
    }

    if (!outputHandler.isReady()) {
      throw new Error(`Output handler ${outputName} is not configured.`);
    }

    for (const output of table.output[outputName]) {
      const { strategy: strategyName, data: strategyData } = output;

      const outputStrategy = outputHandler.handlers
        .filter((strategy) => strategy.name() === strategyName)
        .pop();

      if (typeof outputStrategy === "undefined") {
        throw new Error(`Invalid output strategy: ${strategyName}`);
      }

      const strategyErrors = outputStrategy.isReady(table.fields, strategyData);
      if (strategyErrors.length > 0) {
        throw new Error(
          `Output strategy ${outputName}.${strategyName} is not configured: \n${strategyErrors.join("\n")}`
        );
      }

      table.handlers.push({
        name: `${outputName}.${strategyName}`,
        handler: outputStrategy.handle,
        data: strategyData,
      });
    }
  }

  return table;
};
