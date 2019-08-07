const fields = require("./fields");

module.exports = [
  {
    questionPartial: "received a ballot",
    field: fields["Received ballot"],
  },
  {
    questionPartial: "vote intention",
    field: fields["Voting Intention"],
  },
  {
    questionPartial: "how did they vote",
    field: fields["How did they vote"],
  },
  {
    questionPartial: "need a ballot reissue",
    field: fields["Needs New Ballot"],
  },
  {
    questionPartial: "incorrect number",
    field: fields["Wrong Number"],
  },
  {
    questionPartial: "do not contact",
    field: fields["Do not contact"],
  },
  {
    questionPartial: "new ballot replacement form sent",
    field: fields["New Ballot Issued"],
  },
];
