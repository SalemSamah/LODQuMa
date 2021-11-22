// Put shared constants here

import { Expression, IriTerm, Term, VariableTerm } from "sparqljs";

export const paramMissingError =
  "One or more of the required parameters was missing.";

export const MAX_ROWS = 1000;

//IriTerm | BlankTerm | VariableTerm | QuadTerm;
const subject: VariableTerm = {
  termType: "Variable",
  value: "subject",
  equals: () => false,
};

const predicate: VariableTerm = {
  termType: "Variable",
  value: "predicate",
  equals: () => false,
};

const object: Term = {
  termType: "Variable",
  value: "object",
  equals: () => false,
};

const variable: Term = {
  termType: "Variable",
  value: "class",
  equals: () => false,
};

const type: IriTerm = {
  termType: "NamedNode",
  value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  equals: () => false,
};

const dbo: IriTerm = {
  termType: "NamedNode",
  value: "http://dbpedia.org/ontology/",
  equals: () => false,
};

const dbp: IriTerm = {
  termType: "NamedNode",
  value: "http://dbpedia.org/property/",
  equals: () => false,
};

const foaf: IriTerm = {
  termType: "NamedNode",
  value: "http://xmlns.com/foaf/0.1/",
  equals: () => false,
};

const organisation: IriTerm = {
  termType: "NamedNode",
  value: "http://dbpedia.org/ontology/Organisation",
  equals: () => false,
};

const work: IriTerm = {
  termType: "NamedNode",
  value: "http://dbpedia.org/ontology/Work",
  equals: () => false,
};

const personWikidata: IriTerm = {
  termType: "NamedNode",
  value: "http://www.wikidata.org/entity/Q5",
  equals: () => false,
};
const personFoaf: IriTerm = {
  termType: "NamedNode",
  value: "http://xmlns.com/foaf/0.1/Person",
  equals: () => false,
};
const personSchema: IriTerm = {
  termType: "NamedNode",
  value: "http://schema.org/Person",
  equals: () => false,
};
const personDbo: IriTerm = {
  termType: "NamedNode",
  value: "http://dbpedia.org/ontology/Perosn",
  equals: () => false,
};

/**
 * @description work filter
 * @type IriTerm
 * @var personWikidata, personFoaf, personSchema, personDbo
 */
const personDomain: IriTerm[] = [
  personWikidata,
  personFoaf,
  personSchema,
  personDbo,
];

/**
 * @description organisation filter
 * @type IriTerm
 */
const organisationDomain: IriTerm[] = [organisation];

/**
 * @description work filter
 * @type IriTerm
 */
const workDomain: IriTerm[] = [work];

const wikiPageWikiLink: Expression = {
  termType: "Literal",
  value: "wikiPageWikiLink",
  language: "",
  datatype: {
    termType: "NamedNode",
    value: "http://www.w3.org/2001/XMLSchema#string",
    equals: () => false,
  },
  equals: () => false,
};

const wikiPageRevisionID: Expression = {
  termType: "Literal",
  value: "wikiPageRevisionID",
  language: "",
  datatype: {
    termType: "NamedNode",
    value: "http://www.w3.org/2001/XMLSchema#string",
    equals: () => false,
  },
  equals: () => false,
};

const wikiPageID: Expression = {
  termType: "Literal",
  value: "wikiPageID",
  language: "",
  datatype: {
    termType: "NamedNode",
    value: "http://www.w3.org/2001/XMLSchema#string",
    equals: () => false,
  },
  equals: () => false,
};

const wikiPageExternalLink: Expression = {
  termType: "Literal",
  value: "wikiPageExternalLink",
  language: "",
  datatype: {
    termType: "NamedNode",
    value: "http://www.w3.org/2001/XMLSchema#string",
    equals: () => false,
  },
  equals: () => false,
};

const containerQueryLimit = 1000;
const innerQueryLimit = 2000000;

export {
  containerQueryLimit,
  innerQueryLimit,
  subject,
  predicate,
  object,
  variable,
  type,
  dbo,
  dbp,
  foaf,
  organisation,
  work,
  personWikidata,
  personFoaf,
  personSchema,
  personDbo,
  personDomain,
  organisationDomain,
  workDomain,
  wikiPageWikiLink,
  wikiPageRevisionID,
  wikiPageID,
  wikiPageExternalLink,
};
