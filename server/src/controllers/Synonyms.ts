/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import logger from "@shared/Logger";
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import mongoose from "mongoose";
import { DictionaryPredicate } from "src/models/DictionaryPredicate";
import { DistinctPredicate } from "src/models/DistinctPredicate";
import { DistinctPredicateStore as DPS } from "src/models/DistinctPredicateStore";
import { RDFStoreSchema } from "src/models/RDFStore";
import { Synonyms } from "src/models/Synonyms";
const { OK } = StatusCodes;

const generateSynonymsDictionary = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const DistinctPredicateModel = mongoose.model(
    `${domain}_distinct_predicate`,
    DistinctPredicate
  );

  await DistinctPredicateModel.aggregate(
    [
      { $unwind: "$dic" },
      {
        $group: {
          _id: "$dic",
          synonyms: { $addToSet: "$value" },
        },
      },
      { $match: { $expr: { $gt: [{ $size: "$synonyms" }, 0] } } },
      {
        $project: {
          _id: 0,
          value: "$_id",
          synonyms: "$synonyms",
        },
      },
      { $out: `${domain}_dictionary_predicates` },
    ],
    (err: any, result: any) => {
      if (result) {
        res.status(OK).json({
          data: result,
        });
      }
      if (err) {
        res.status(500).json({ error: err });
      }
    }
  );
};

const saveDistinctPredicates = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const DistinctPredicateModel = mongoose.model(
    `${domain}_distinct_predicate`,
    DistinctPredicate
  );

  await DistinctPredicateModel.aggregate(
    [
      {
        $group: { _id: null, predicates: { $push: "$value" } },
      },
      {
        $project: { _id: false, domain, predicates: true },
      },
      { $out: `distinct_predicate_values` },
    ],
    (err: any, result: any) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      if (result) {
        return res.status(201).json({
          data: `${domain} distinct predicate values document created successfully !`,
        });
      }
    }
  );
};

const cleanDictionary = async (req: Request, res: Response) => {
  const { domain } = req.body;

  const DistinctPredicateStore = mongoose.model(
    `distinct_predicate_values`,
    DPS
  );
  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );
  const dPSResult = await DistinctPredicateStore.findOne({ domain });
  if (dPSResult) {
    const predicates: string[] = dPSResult.predicates;
    const predicatesLength = predicates.length;
    predicates.forEach(async (predicate: string, index: number) => {
      const dictionaryPredicateSets = await dictionaryPredicateModel.aggregate([
        { $match: { synonyms: { $in: [predicate] } } },
        {
          $project: {
            _id: "$_id",
            value: "$value",
            synonyms: "$synonyms",
            size: { $size: "$synonyms" },
          },
        },
        { $sort: { size: -1 } },
      ]);

      //DELETE the rest of the sets, unused Synonyms sets
      const toDeleteDictionaryPredicateSets = dictionaryPredicateSets.slice(1);

      if (toDeleteDictionaryPredicateSets.length) {
        const toDDPSIds = toDeleteDictionaryPredicateSets.map(
          (element: any) => element._id
        );
        await dictionaryPredicateModel.deleteMany({
          _id: toDDPSIds,
        });
      }
      if (index === predicatesLength - 1) {
        return res.status(200).json({
          data: `${domain} dictionary predicate cleaned successfully !`,
        });
      }
    });
  } else {
    res.status(404).json({ error: "Resource not found !" });
  }
};

const generateQVCs = async (req: Request, res: Response) => {
  const { domain } = req.body;

  const DistinctPredicateStore = mongoose.model(
    `distinct_predicate_values`,
    DPS
  );
  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );
  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  const SynonymsRDFStore = mongoose.model(`${domain}_synonyms`, Synonyms);

  const dPSResult = await DistinctPredicateStore.findOne({ domain });
  if (dPSResult) {
    const predicates: string[] = dPSResult.predicates;
    const predicatesLength = predicates.length;
    predicates.forEach(async (predicate: string, index: number) => {
      const dictionaryPredicateSets = await dictionaryPredicateModel.aggregate([
        { $match: { synonyms: { $in: [predicate] }, isUsed: null } },
        {
          $project: {
            _id: "$_id",
            value: "$value",
            synonyms: "$synonyms",
            size: { $size: "$synonyms" },
          },
        },
        { $sort: { size: -1 } },
      ]);

      let synonyms: string[] = [];
      if (dictionaryPredicateSets.length) {
        //UPDATE the the sets, isUsed = true
        const toUDPSIds = dictionaryPredicateSets.map(
          (element: any) => element._id
        );
        await dictionaryPredicateModel.updateMany(
          {
            _id: toUDPSIds,
          },
          { $set: { isUsed: true } }
        );
        synonyms = dictionaryPredicateSets[0].synonyms;
      } else {
        synonyms = [predicate];
      }

      const synonymsRDFStoreElement = await RDFStore.aggregate([
        {
          $match: {
            "predicate.value": {
              $in: synonyms,
            },
          },
        },
        {
          $project: {
            _id: 0,
            subject: "$subject",
            predicate: "$predicate",
            object: "$object",
          },
        },
      ]);

      SynonymsRDFStore.create(
        {
          value: predicate,
          RDFStore: synonymsRDFStoreElement,
        },
        (err, result) => {
          if (result && index === predicatesLength - 1) {
            // TODO: put the response in the right scope !
            return res.status(200).json({
              data: `QVC's clusters for ${domain} generated succuessfully`,
            });
          }
          if (err) {
            res.status(404).json({ error: err });
          }
        }
      );
    });
  } else {
    res.status(404).json({ error: "Resource not found !" });
  }
};

export {
  generateSynonymsDictionary,
  generateQVCs,
  saveDistinctPredicates,
  cleanDictionary,
};
