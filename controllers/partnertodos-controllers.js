const uuid = require("uuid/v4");
const HttpError = require("../models/HttpError");

let DUMMY_PARTNER = [
  {
    id: "p1",
    name: "test Partner",
    email: "test@gmail.com",
    linkedPerson: "test@test.com",
    goals: [
      {
        title: "Meditate",
        deadline: "29 / 12 / 2019",
        description: "Meditate for 30 days for 10 mins a day.",
        status: true
      },
      {
        title: "Exercise",
        deadline: "30 / 01 / 2020",
        description: "Get fitter using couch to 5k.",
        status: false
      }
    ],
    suggestedGoals: []
  },
  {
    id: "p2",
    name: "test Partner",
    email: "test@gmail.com",
    linkedPerson: "test@test.com",
    goals: [
      {
        title: "Meditate",
        deadline: 29 / 12 / 2019,
        description: "Meditate for 30 days for 10 mins a day."
      },
      {
        title: "Exercise",
        deadline: 30 / 01 / 2020,
        description: "Get fitter using couch to 5k."
      }
    ],
    suggestedGoals: []
  }
];

// @DESC    Get partner by ID
// @TYPE    GET
// @ROUTES  /api/v1/partner
// PRIVATE
const getPartnerById = (req, res, next) => {
  const partnerId = req.params.pid;
  const partner = DUMMY_PARTNER.find(p => p.id === partnerId);
  console.log(partner);
  if (!partner) {
    return next(new HttpError("Could not find partner", 400));
  }

  res.status(200).json({ success: true, data: partner });
};

// @DESC    Suggest goal to partner
// @TYPE    put
// @ROUTES  /api/v1/partner/suggest
// PRIVATE
const suggestGoal = (req, res, next) => {
  const partnerId = req.params.pid;
  const { suggestion } = req.body;
  const partner = { ...DUMMY_PARTNER.find(p => p.id === partnerId) };
  const partnerIndex = DUMMY_PARTNER.findIndex(p => p.id === partnerId);

  DUMMY_PARTNER[partnerIndex].suggestedGoals.push(suggestion);

  res.status(200).json({ success: true, data: partner });
};

exports.getPartnerById = getPartnerById;
exports.suggestGoal = suggestGoal;
