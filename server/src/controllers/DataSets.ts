/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IQueryResultBindings } from "@comunica/actor-init-sparql";
import { replaceURIbyPrefixe } from "@shared/functions";
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import mongoose from "mongoose";
import { RDFTerm } from "src/interfaces/RDF";
import { RDFStoreSchema } from "src/models/RDFStore";
import { execQuey, generateSparql } from "src/services/sparqlQuery";

const { OK, CREATED, INTERNAL_SERVER_ERROR } = StatusCodes;

/**
 * Get datasets from sparql endpoint and store results as in GCP, mongod server
 *
 * @param req
 * @param res
 * @returns
 */
const getDataSetsAsCsv = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  const result = (await execQuey(domain, undefined)) as IQueryResultBindings;
  result.bindingsStream.on("data", (binding) => {
    const subject: RDFTerm = binding.get("?subject");
    const predicate: RDFTerm = binding.get("?predicate");
    const object: RDFTerm = binding.get("?object");

    RDFStore.create({
      subject: replaceURIbyPrefixe(subject),
      predicate: replaceURIbyPrefixe(predicate),
      object: replaceURIbyPrefixe(object),
    });
  });

  result.bindingsStream.on("end", () => {
    return res.status(CREATED).json({ data: "dataset created successfully" });
  });

  result.bindingsStream.on("error", (error) => {
    return res.status(INTERNAL_SERVER_ERROR).json({ error });
  });
};

const generateQuery = (req: Request, res: Response) => {
  const { domain } = req.body;
  const query = generateSparql(domain, undefined);
  return res.status(OK).json({ data: query });
};

export { getDataSetsAsCsv, generateQuery };
