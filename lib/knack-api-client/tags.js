/**
 * Tags map for converting tags to Knack fields
 */
const fields = require("./fields");

module.exports = [
  {
    name: "Do not call about ballot",
    field: fields["Do not contact"],
    value: true,
  },
  {
    name: "How did they vote - Yet to vote",
    field: fields["How did they vote"],
    value: "Yet to Vote",
  },
  {
    name: "How did they vote - Unsure",
    field: fields["How did they vote"],
    value: "Unsure",
  },
  {
    name: "How did they vote - No",
    field: fields["How did they vote"],
    value: "No",
  },
  {
    name: "How did they vote - Yes",
    field: fields["How did they vote"],
    value: "Yes",
  },
  {
    name: "Vote intention - Unsure",
    field: fields["Voting Intention"],
    value: "Unsure",
  },
  {
    name: "Vote intention - No",
    field: fields["Voting Intention"],
    value: "No",
  },
  {
    name: "Vote intention - Yes",
    field: fields["Voting Intention"],
    value: "Yes",
  },
  {
    name: "Recieved ballot - No",
    field: fields["Has Received Ballot Paper"],
    value: false,
  },
  {
    name: "Recieved ballot - Yes",
    field: fields["Has Received Ballot Paper"],
    value: true,
  },
  {
    name: "Needs a Ballot reissued",
    field: fields["Needs New Ballot"],
    value: true,
  },
  {
    name: "Wrong Number",
    field: fields["Wrong Number"],
    value: true,
  },
];
