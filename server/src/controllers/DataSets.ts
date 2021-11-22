/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IQueryResultBindings } from "@comunica/actor-init-sparql";
import { replaceURIbyPrefixe } from "@shared/functions";
import logger from "@shared/Logger";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import gc from "expose-gc/function";
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import mongoose from "mongoose";
import { RDFTerm } from "src/interfaces/RDF";
import { RDFStoreSchema } from "src/models/RDFStore";
import {
  execQuey,
  generateSparql,
  getIterations,
} from "src/services/sparqlQuery";

const { OK, CREATED, INTERNAL_SERVER_ERROR } = StatusCodes;

/**
 * Get datasets from sparql endpoint and store results as in GCP, mongod server
 *
 * @param req
 * @param res
 * @returns
 */
const getDataSetsAsCsv = (req: Request, res: Response) => {
  const { domain, rows } = req.body;

  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  const iterations = getIterations(rows);
  const LENGTH = iterations.length;

  iterations.forEach(async (iteration, index) => {
    const result = (await execQuey(
      domain,
      iteration.offset,
      iteration.limit
    )) as IQueryResultBindings;
    const manyRows: any[] = [];

    result.bindingsStream.on("data", (binding) => {
      manyRows.push({
        subject: replaceURIbyPrefixe(binding.get("?subject") as RDFTerm),
        predicate: replaceURIbyPrefixe(binding.get("?predicate") as RDFTerm),
        object: replaceURIbyPrefixe(binding.get("?object") as RDFTerm),
      });
    });

    result.bindingsStream.on("end", () => {
      // The data-listener will not be called anymore once we get 10K rows saved in GCP mongoDB
      RDFStore.insertMany(manyRows);
      logger.warn(
        `rows saved : ....${JSON.stringify({
          offset: iteration.offset,
          limit: iteration.limit,
        })}`
      );
      gc();
    });

    result.bindingsStream.on("error", (error) => {
      gc();
      return res.status(INTERNAL_SERVER_ERROR).json({ error });
    });
    gc();
    if (index === LENGTH - 1) {
      result.bindingsStream.on("end", () => {
        gc();
        return res
          .status(CREATED)
          .json({ data: "dataset created successfully" });
      });
    }
  });
};

const generateQuery = (req: Request, res: Response) => {
  const { domain } = req.body;
  const query = generateSparql(domain, undefined, undefined);
  return res.status(OK).json({ data: query });
};

export { getDataSetsAsCsv, generateQuery };
