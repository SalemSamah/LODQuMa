import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
const { OK } = StatusCodes;

/**
 * Get datasets from sparql endpoint and store results as CSV files
 *
 * @param req
 * @param res
 * @returns
 */
export const getDataSetsAsCsv = (req: Request, res: Response) => {
  return res.status(OK).json({ data: "result" });
};
