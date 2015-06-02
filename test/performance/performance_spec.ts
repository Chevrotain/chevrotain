/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../examples/json/json_parser.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.performance.spec {

    var sampleInput = "{ \r\n" +
        "  \"fathers\" : [ \r\n" +
        "    { \r\n" +
        "      \"id\" : 0,\r\n" +
        "      \"married\" : true,\r\n" +
        "      \"name\" : \"David Martinez\",\r\n" +
        "      \"sons\" : 5 ,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Angela\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 1,\r\n" +
        "      \"married\" : true,\r\n" +
        "      \"name\" : \"Richard Martin\",\r\n" +
        "      \"sons\" : 66,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Angela\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 6,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 0,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 0,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 6,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 2,\r\n" +
        "      \"married\" : true,\r\n" +
        "      \"name\" : \"Robert Taylor\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 0,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 6,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 3,\r\n" +
        "      \"married\" : false,\r\n" +
        "      \"name\" : \"Steven Hall\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 6,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 31,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Cynthia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 10,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Cynthia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 4,\r\n" +
        "      \"married\" : false,\r\n" +
        "      \"name\" : \"Timothy Allen\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Brenda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Michelle\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Deborah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 27,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Elizabeth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 27,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 27,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 17,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Sharon\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 6,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 0,\r\n" +
        "          \"name\" : \"Deborah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Brenda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 5,\r\n" +
        "      \"married\" : true,\r\n" +
        "      \"name\" : \"Matthew Smith\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Brenda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 31,\r\n" +
        "          \"name\" : \"Donna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Angela\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Michelle\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 23,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 21,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Elizabeth\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 6,\r\n" +
        "      \"married\" : false,\r\n" +
        "      \"name\" : \"John White\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 27,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 2,\r\n" +
        "          \"name\" : \"Jennifer\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Cynthia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Michelle\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 7,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Melissa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Deborah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 10,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Michelle\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Ruth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Michelle\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 5,\r\n" +
        "          \"name\" : \"Brenda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Susan\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 15,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Laura\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Angela\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Cynthia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Angela\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 24,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      },\r\n" +
        "    { \r\n" +
        "      \"id\" : 7,\r\n" +
        "      \"married\" : false,\r\n" +
        "      \"name\" : \"Frank Taylor\",\r\n" +
        "      \"sons\" : 55,\r\n" +
        "      \"daughters\" : [ \r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 26,\r\n" +
        "          \"name\" : \"Sandra\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Barbara\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Brenda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Elizabeth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Elizabeth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 9,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 1,\r\n" +
        "          \"name\" : \"Linda\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Dorothy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 20,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 16,\r\n" +
        "          \"name\" : \"Lisa\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 22,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 3,\r\n" +
        "          \"name\" : \"Nancy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 13,\r\n" +
        "          \"name\" : \"Anna\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Elizabeth\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Kimberly\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Maria\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 8,\r\n" +
        "          \"name\" : \"Patricia\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 19,\r\n" +
        "          \"name\" : \"Margaret\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 30,\r\n" +
        "          \"name\" : \"Helen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 18,\r\n" +
        "          \"name\" : \"Sarah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 25,\r\n" +
        "          \"name\" : \"Mary\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 29,\r\n" +
        "          \"name\" : \"Deborah\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 28,\r\n" +
        "          \"name\" : \"Karen\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Betty\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 4,\r\n" +
        "          \"name\" : \"Jessica\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 14,\r\n" +
        "          \"name\" : \"Carol\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 11,\r\n" +
        "          \"name\" : \"Amy\"\r\n" +
        "          },\r\n" +
        "        { \r\n" +
        "          \"age\" : 12,\r\n" +
        "          \"name\" : \"Shirley\"\r\n" +
        "          }\r\n" +
        "        ]\r\n" +
        "      }\r\n" +
        "    ]\r\n" +
        "  }"


    var NUM_OF_TIMES = 1000
    xdescribe("Performance Testing", function () {
        "use strict"


        function NOW() {
            return new Date().getTime()
        }

        var totalChevrotain = 0
        var lexTotal = 0
        var parseTotal = 0

        xit("performance test", function () {


            var start = NOW()
            _.forEach(_.range(NUM_OF_TIMES), () => {
                var lexStart = NOW()
                var lexResult = examples.json.JsonLexer.tokenize(sampleInput)
                expect(lexResult.errors.length).toBe(0)
                lexTotal += NOW() - lexStart
                var parseStart = NOW()
                var parser = new examples.json.JsonParser(lexResult.tokens)
                parser.object()
                parseTotal += NOW() - parseStart
                expect(parser.errors.length).toBe(0)
                expect(parser.isAtEndOfInput()).toBe(true)
            })
            var end = NOW();
            totalChevrotain = end - start

            console.log("chevrotain: " + totalChevrotain)
            console.log("chevrotain Lexer : " + lexTotal)
            console.log("chevrotain Parser total : " + parseTotal)
            console.log("chevrotain Parser average : " + parseTotal / NUM_OF_TIMES)
        })

        //var totalJison = 0;
        //fit("performance test", function () {
        //    var start = NOW()
        //    _.forEach(_.range(NUM_OF_TIMES), () => {
        //        jsoncheck.parse(sampleInput)
        //    })
        //    var end = NOW();
        //    totalJison = end - start
        //    console.log("jison: " + totalJison)
        //})

    })
}
