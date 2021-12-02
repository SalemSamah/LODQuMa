/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  CASE_02_PRD,
  CASE_03_PRD,
  QVC1,
  QVC2,
  QVC3,
  QVC4,
  replaceSpecialCaracter,
} from "@shared/constants";
import { difference } from "@shared/functions";
import logger from "@shared/Logger";
import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import _ from "lodash";
import mongoose from "mongoose";
import { DictionaryPredicate } from "src/models/DictionaryPredicate";
import { DistinctPredicate } from "src/models/DistinctPredicate";
import { DistinctPredicateStore as DPS } from "src/models/DistinctPredicateStore";
import { QVCSchema } from "src/models/QVCStore";
import { RDFStoreSchema } from "src/models/RDFStore";
import { Synonyms } from "src/models/Synonyms";
import SparqlParser from "sparqljs";
import {
  default as SparqlGenerator,
  IriTerm,
  SparqlQuery,
  Variable,
} from "sparqljs";
import {
  IQueryResult,
  IQueryResultBindings,
  newEngine,
} from "@comunica/actor-init-sparql";
const { OK, CREATED, INTERNAL_SERVER_ERROR } = StatusCodes;
const myEngine = newEngine();
const parser = SparqlParser.Parser;
const generator = SparqlGenerator.Generator;
const ObjectId = mongoose.Types.ObjectId;

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

const saveRarePredicates = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const aggregate_qury = [
    {
      $group: {
        _id: null,
        cleanDistinct: {
          $push: {
            $arrayElemAt: ["$synonyms", 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "distinct_predicate_values",
        localField: "predicates",
        foreignField: "cleanDistinct",
        as: "allDistinct",
      },
    },
    {
      $project: {
        cd: "$cleanDistinct",
        ad: {
          $arrayElemAt: ["$allDistinct", 0],
        },
      },
    },
    {
      $project: {
        cd: "$cd",
        ad: "$ad.predicates",
      },
    },
    {
      $project: {
        diff: {
          $setDifference: ["$ad", "$cd"],
        },
      },
    },
    { $out: `${domain}_rare_predicates` },
  ];

  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );

  await dictionaryPredicateModel
    .aggregate(aggregate_qury)
    .exec((err, result) => {
      if (err) {
        res.status(500).json({ error: err });
      }
      if (result) {
        res.status(201).json({
          data: `Rare predicates generated for ${domain} succussfully !`,
        });
      }
    });
};

const generateQVCs2 = async (req: Request, res: Response) => {
  const { domain } = req.body;

  const DistinctPredicateStore = mongoose.model(
    `distinct_predicate_values`,
    DPS
  );

  DistinctPredicateStore.db.db
    .admin()
    .command({ setParameter: 1, cursorTimeoutMillis: 7200000 }, (err, res) => {
      if (err) {
        console.log("err: ", err);
      }
      if (res) {
        console.log("res: ", res);
      }
    });

  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );
  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  const SynonymsRDFStore = mongoose.model(`${domain}_synonyms`, Synonyms);

  const dPSResult = await DistinctPredicateStore.findOne({ domain });
  if (dPSResult) {
    const predicates: string[] = dPSResult.predicates;
    await Promise.all(
      predicates.map(async (predicate: string) => {
        const dictionaryPredicateSets = await dictionaryPredicateModel
          .aggregate([
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
          ])
          .allowDiskUse(true);

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

        //const synonymsRDFStoreElement =
        await RDFStore.aggregate([
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

          { $out: `${predicate}_${domain}_synonyms` },
        ]).allowDiskUse(true);
        /*
        SynonymsRDFStore.create(
          {
            value: predicate,
            RDFStore: synonymsRDFStoreElement,
          },
          (err, result) => {
            if (err) {
              res.status(500).json({ error: err });
            }
          }
        );
        */
      })
    );
    // TODO: put the response in the right scope !
    res.status(200).json({
      data: `QVC's clusters for ${domain} generated succuessfully`,
    });
  } else {
    res.status(404).json({ error: "Resource not found !" });
  }
};

const generateQVCs = async (req: Request, res: Response) => {
  const { domain } = req.body;

  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );

  dictionaryPredicateModel.db.db
    .admin()
    .command({ setParameter: 1, cursorTimeoutMillis: 7200000 }, (err, res) => {
      if (err) {
        logger.warn(`err:  ${JSON.stringify(err)}`);
      }
      if (res) {
        logger.warn(`res:  ${JSON.stringify(res)}`);
      }
    });

  const RDFStore = mongoose.model(domain, RDFStoreSchema);
  const dPs = await dictionaryPredicateModel
    .find({})
    .select("synonyms value -_id");
  if (dPs) {
    await Promise.all(
      dPs.map(async (dPsElement: any) => {
        await RDFStore.aggregate([
          {
            $match: {
              "predicate.value": {
                $in: dPsElement.synonyms,
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

          { $out: `${dPsElement.value}_${domain}_synonyms` },
        ]).allowDiskUse(true);
      })
    );
    res.status(200).json({
      data: `QVC's clusters for ${domain} generated succuessfully`,
    });
  } else {
    res.status(404).json({ error: "Resource not found !" });
  }
};

const getQVC = (diff: any, predicate: any) => {
  let QVC = undefined;

  if (diff?.object && diff?.predicate && diff?.subject) {
    QVC = QVC4;
  }
  if (_.isEmpty(diff) || (diff?.predicate && !diff?.subject && !diff?.object)) {
    QVC = QVC1;
  }
  if (diff?.object && !diff?.subject && CASE_02_PRD.includes(predicate.value)) {
    QVC = QVC2;
  }
  if (diff?.subject && !diff?.object && CASE_03_PRD.includes(predicate.value)) {
    QVC = QVC3;
  }

  return QVC;
};

const showQVCs = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const QVC1Store = mongoose.model(`${domain}_QVC1`, QVCSchema(domain));
  const qvcs1 = await QVC1Store.find({});

  res.status(200).json({ data: qvcs1 });
};
const saveQVCs = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const dictionaryPredicateModel = mongoose.model(
    `${domain}_dictionary_predicates`,
    DictionaryPredicate
  );

  const synonymsSets = await dictionaryPredicateModel.find({
    $expr: { $gt: [{ $size: "$synonyms" }, 1] },
  });
  let c = 0;
  let qvcSum = 0;

  await Promise.all(
    synonymsSets.map(async (synSets: any) => {
      const synStore = synSets.synonyms;
      const storeLenght = synStore.length;
      let i = 0;
      async function* asyncGenerator() {
        let j = i + 1;
        while (j < storeLenght) {
          yield j++;
        }
      }
      while (i < storeLenght - 1) {
        for await (const j of asyncGenerator()) {
          const sparqlQuery = `
          PREFIX dbo:  <http://dbpedia.org/ontology/>
          PREFIX dbp:  <http://dbpedia.org/property/>
          PREFIX dbr:  <http://dbpedia.org/resource/>
          PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  
          SELECT (count(*) as ?triples) 
          WHERE 
          { 
            SELECT * WHERE {
              SELECT ?subject  ?subject1  ?predicate ?predicate1  ?object 
                WHERE {
                    ?subject  a foaf:Person ; ?predicate1 ?object. 
                    ?subject1  a foaf:Person ; ?predicate ?object. 
                  FILTER (?subject = ?subject1)
                  FILTER ( ?predicate IN (${replaceSpecialCaracter(
                    synStore[i]
                  )}) )
                  FILTER ( ?predicate1 IN (${replaceSpecialCaracter(
                    synStore[j]
                  )}) )
                }
                ORDER BY DESC(?subject)
            }
          }
        `;
          const p1 = synStore[i];
          const p2 = synStore[j];
          const result = (await myEngine.query(sparqlQuery, {
            sources: ["https://dbpedia.org/sparql"],
          })) as IQueryResultBindings;
          let result__: undefined;

          result.bindingsStream.on("data", (binding) => {
            result__ = binding.get("?triples").value;
            if (
              result__ &&
              parseInt(result__) > 0 &&
              sparqlQuery.includes("party")
            ) {
              console.log(
                ` ${p1} , ${p2}`,
                sparqlQuery.substr(740, sparqlQuery.length).slice(0, -80)
              );
            }
          });

          result.bindingsStream.on("end", () => {
            if (result__ && parseInt(result__) > 0)
              qvcSum = qvcSum + parseInt(result__);
          });

          result.bindingsStream.on("error", (error) => {
            logger.err(`result: (${synStore[i]},${synStore[j]}) :::> ${error}`);
            return res.status(INTERNAL_SERVER_ERROR).json({ error });
          });

          c++;
        }
        i++;
      }
    })
  );
  logger.warn(`poss; ${c}`);
  logger.warn(`QVC1 SUM: ${qvcSum}`);
  res.status(OK).json({ data: `QVC1 : ${qvcSum}` });
};
const saveQVCs2 = async (req: Request, res: Response) => {
  const { domain } = req.body;
  const RDFStore = mongoose.model(
    `name_${domain}_synonyms`,
    RDFStoreSchema,
    `name_${domain}_synonyms`
  );

  const QVC1Store = mongoose.model(`${domain}_QVC1`, QVCSchema(domain));
  const QVC2Store = mongoose.model(`${domain}_QVC2`, QVCSchema(domain));
  const QVC3Store = mongoose.model(`${domain}_QVC3`, QVCSchema(domain));
  const QVC4Store = mongoose.model(`${domain}_QVC4`, QVCSchema(domain));

  const rdfStore = await RDFStore.find({});
  const storeLenght = rdfStore.length;
  let i = 0;
  let c = 0;
  while (i < storeLenght - 1) {
    for (let j = i + 1; j < storeLenght; j++) {
      const qvc = getQVC(
        difference(rdfStore[i], rdfStore[j])._doc,
        rdfStore[i].predicate
      );
      if (qvc) {
        switch (qvc) {
          case QVC1: {
            await QVC1Store.create({
              triple01: rdfStore[i]._id,
              triple02: rdfStore[j]._id,
            });
            break;
          }
          case QVC2: {
            await QVC2Store.create({
              triple01: rdfStore[i]._id,
              triple02: rdfStore[j]._id,
            });
            break;
          }
          case QVC3: {
            await QVC3Store.create({
              triple01: rdfStore[i]._id,
              triple02: rdfStore[j]._id,
            });
            break;
          }
          case QVC4: {
            await QVC4Store.create({
              triple01: rdfStore[i]._id,
              triple02: rdfStore[j]._id,
            });
            break;
          }
          default:
            break;
        }
      }
      c++;
      logger.warn(`Progress : ${c} triples scanned !`);
      if (c % 100000 === 0) {
        logger.warn(`Progress ___: ${c} triples scanned !`);
      }
    }
    i++;
  }

  if (rdfStore) {
    res.status(200).json({ data: storeLenght });
  } else {
    res.status(500).json({ error: "unknown error !" });
  }
};

export {
  generateSynonymsDictionary,
  generateQVCs,
  saveDistinctPredicates,
  cleanDictionary,
  saveRarePredicates,
  saveQVCs,
  showQVCs,
};
