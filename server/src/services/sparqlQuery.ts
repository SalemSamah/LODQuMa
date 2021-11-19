/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { newEngine } from "@comunica/actor-init-sparql";
import SparqlGenerator from "sparqljs";
import SparqlParser from "sparqljs";
import fs from "fs";

const writable = fs.createWriteStream("res.json");
const myEngine = newEngine();
const generator = SparqlGenerator.Generator;
const parser = SparqlParser.Parser;

const execQuey = async () => {
  const result = await myEngine.query(
    `
    PREFIX dbo: <http://dbpedia.org/ontology/> 
    PREFIX dbp: <http://dbpedia.org/property/> 
    PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
    SELECT
    *
    WHERE
    {
    ?subject ?predicate ?object.
    FILTER( STRSTARTS(STR(?predicate),str(dbo:)) || STRSTARTS(STR(?predicate),str(dbp:)) || STRSTARTS(STR(?predicate),str(foaf:)) )
    FILTER (!contains(STR(?predicate),"abstract") && !contains(STR(?predicate),"wikiPageExternalLink") && !contains(STR(?predicate),"wikiPageID") && !contains(STR(?predicate),"wikiPageRevisionID") && !contains(STR(?predicate),"wikiPageWikiLink"))
    {
    SELECT DISTINCT ?subject WHERE { ?subject a ?class. FILTER (?class in(dbo:Organisation)). } LIMIT 60000
    }
    }
    OFFSET 0
    LIMIT 10
    
    `,
    {
      sources: ["https://dbpedia.org/sparql"],
    }
  );

  const { data } = await myEngine.resultToString(
    result,
    "application/sparql-results+json"
  );
  data.pipe(writable);

  return result;
};

const generateSparql = () => {
  // TODO: make use of this function to enhance query personalization
  const query = {
    queryType: "SELECT",
    variables: [
      {
        termType: "Variable",
        value: "p",
      },
      {
        termType: "Variable",
        value: "c",
      },
    ],
    where: [
      {
        type: "bgp",
        triples: [
          {
            subject: {
              termType: "Variable",
              value: "p",
            },
            predicate: {
              termType: "NamedNode",
              value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            object: {
              termType: "NamedNode",
              value: "http://dbpedia.org/ontology/Artist",
            },
          },
          {
            subject: {
              termType: "Variable",
              value: "p",
            },
            predicate: {
              termType: "NamedNode",
              value: "http://dbpedia.org/ontology/birthPlace",
            },
            object: {
              termType: "Variable",
              value: "c",
            },
          },
          {
            subject: {
              termType: "Variable",
              value: "c",
            },
            predicate: {
              termType: "NamedNode",
              value: "http://xmlns.com/foaf/0.1/name",
            },
            object: {
              termType: "Literal",
              value: "York",
              language: "en",
              datatype: {
                termType: "NamedNode",
                value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
              },
            },
          },
        ],
      },
    ],
    type: "query",
    prefixes: {
      "dbpedia-owl": "http://dbpedia.org/ontology/",
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const generatedQuery = new generator().stringify({ query } as any);
  const sparqlQuery = `
      PREFIX dbo: <http://dbpedia.org/ontology/> 
      PREFIX dbp: <http://dbpedia.org/property/> 
      PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
      SELECT
        *
        WHERE
        {
        ?subject ?predicate ?object.
        FILTER( STRSTARTS(STR(?predicate),str(dbo:)) || STRSTARTS(STR(?predicate),str(dbp:)) || STRSTARTS(STR(?predicate),str(foaf:)) )
        FILTER (!contains(STR(?predicate),"abstract") && !contains(STR(?predicate),"wikiPageExternalLink") && !contains(STR(?predicate),"wikiPageID") && !contains(STR(?predicate),"wikiPageRevisionID") && !contains(STR(?predicate),"wikiPageWikiLink"))
        {
        #SELECT DISTINCT ?subject WHERE { ?subject a ?class. FILTER (?class in(wikidata:Q5, foaf:Person, schema:Person, dbo:Perosn)). } LIMIT 40827
        #SELECT DISTINCT ?subject WHERE { ?subject a ?class. FILTER (?class in(dbo:Work)). } LIMIT 50000
        SELECT DISTINCT ?subject WHERE { ?subject a ?class. FILTER (?class in(dbo:Organisation)). } LIMIT 60000
        }
        }
        LIMIT 100
  
  `;
  const parsedQuery = new parser().parse(sparqlQuery);

  return parsedQuery;
};
export { execQuey, generateSparql };
