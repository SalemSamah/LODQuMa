import { LOCALNAMESPACES } from 'src/config/SparqlQuery';
import { RDFTerm } from 'src/interfaces/RDF';
import logger from './Logger';

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