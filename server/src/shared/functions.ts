/* eslint-disable @typescript-eslint/no-unsafe-return */
import _ from "lodash";
import { LOCALNAMESPACES } from "src/config/SparqlQuery";
import { RDFTerm } from "src/interfaces/RDF";
import logger from "./Logger";

export const pErr = (err: Error) => {
  if (err) {
    logger.err(err);
  }
};

export const getRandomInt = () => {
  return Math.floor(Math.random() * 1_000_000_000_000);
};

export const replaceURIbyPrefixe = (rdfTerm: RDFTerm): RDFTerm => {
  if (rdfTerm.termType === "NamedNode") {
    for (const [key, value] of Object.entries(LOCALNAMESPACES)) {
      if (rdfTerm.value.includes(value)) {
        rdfTerm.value = rdfTerm.value.replace(value, `${key}:`);
      }
    }
  }
  return rdfTerm;
};

export const sleep = async (millis: number) => {
  return new Promise((resolve) => setTimeout(resolve, millis));
};

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
export const difference = (object: any, base: any) => {
  const changes = (object: any, base: any) => {
    return _.transform(object,  (result: any, value, key) =>{
      if (!_.isEqual(value, base[key])) {
        result[key] =
          _.isObject(value) && _.isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  };
  return changes(object, base);
};
