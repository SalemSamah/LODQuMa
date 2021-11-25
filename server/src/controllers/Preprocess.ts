/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import mongoose from "mongoose";
import WordNet from "node-wordnet";
import { DistinctPredicate } from "src/models/DistinctPredicate";
import { RDFStoreSchema } from "src/models/RDFStore";
import Typo from "typo-js";
const wordnet = new WordNet();
const dictionary = new Typo("en_US");
const { OK } = StatusCodes;

const generateSynonyms = (word: string): Promise<string[]> => {
  const open = async (word: string): Promise<string[]> => {
    const lookupResult: string[] = await wordnet
      .lookupAsync(word)
      .then((data: any) => {
        const synSet: string[] = [];
        data.forEach((elem: any) => {
          synSet.push(elem.lemma as string);
        });
        return synSet;
      });
    return lookupResult;
  };
  return open(word);
};

/**
 * Generate Diff stats, (Δ ?subject/?predicat/?object)
 *
 * @param req
 * @param res
 * @returns
 */
const generateDiffStats = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  await RDFStore.aggregate(
    [
      {
        $group: {
          _id: "$predicate.value",
        },
      },
      {
        $project: {
          _id: 0,
          value: "$_id",
        },
      },
      { $out: `${domain}_distinct_predicates` },
    ],
    (err: any, result: any) => {
      if (result) {
        res.status(OK).json({
          data: {
            distinctPredicates: "Distinct predicates generated successfully !",
          },
        });
      }
      if (err) {
        res.status(500).json({ error: err });
      }
    }
  );
};

/**
 * Generate Synonyms sets, (Δ ?predicat)
 *
 * @param req
 * @param res
 * @returns
 */
const generateSynonymSets = (req: Request, res: Response) => {
  const { domain } = req.body;
  const DistinctPredicateModel = mongoose.model(
    `${domain}_distinct_predicate`,
    DistinctPredicate
  );

  const bulk = DistinctPredicateModel.collection.initializeOrderedBulkOp();

  DistinctPredicateModel.find().exec(async (err: any, result: any) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    if (result) {
      await Promise.all(
        result.map(async (rdfTerm: any) => {
          const readableValue = rdfTerm.value.split(":")[1];
          const is_spelled_correctly = dictionary.check(readableValue);
          const array_of_suggestions = !is_spelled_correctly
            ? dictionary.suggest(readableValue)
            : [];

          const synonyms = await generateSynonyms(readableValue);
          const dic = [
            ...new Set([...array_of_suggestions, ...synonyms, readableValue]),
          ];
          bulk.find({ _id: rdfTerm._id }).update({ $set: { dic: dic } });
        })
      );
      bulk.execute((err) => {
        if (err) {
          return res.status(500).json({ error: err });
        }
      });
      res.status(OK).json({
        data: "Synonyms sets generated successfully !",
      });
    }
  });
};

export { generateDiffStats, generateSynonymSets };
