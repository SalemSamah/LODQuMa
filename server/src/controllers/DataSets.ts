/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IQueryResultBindings } from "@comunica/actor-init-sparql";
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { execQuey, generateSparql } from "src/services/sparqlQuery";
const { OK } = StatusCodes;

/**
 * Get datasets from sparql endpoint and store results as CSV files
 *
 * @param req
 * @param res
 * @returns
 */
const getDataSetsAsCsv = async (req: Request, res: Response) => {
  const result = (await execQuey()) as IQueryResultBindings;
  result.bindingsStream.on("data", (binding) => {
    //console.log(binding.get("?s").value);
    //console.log(binding.get("?s").termType);
    //console.log(binding.get("?p").value);
    //console.log(binding.get("?o").value);
    /*console.log(
      `${binding.get("?subject").value as string} --- ${
        binding.get("?predicate").value as string
      } --- ${binding.get("?object").value as string}`
    );*/
  });

  return res.status(OK).json({ data: "result" });
};

const generateQuery = (req: Request, res: Response) => {
  const query = generateSparql();
  return res.status(OK).json({ data: query });
};

export { getDataSetsAsCsv, generateQuery };
