const collegeModel = require("../models/collegeModel");
const internModel = require("../models/internModel");

let validName = /^[A-Za-z]+$/;
let validateUrl = function (url) {
  let validlogoUrlregex = /^https?:\/\/.*\/.*\.(png|jpeg|jpg)\??.*$/gim;
  return validlogoUrlregex.test(url);
};

const createCollege = async function (req, res) {
  try {
    const collegeDetails = req.body;
    const filteredCollegeDetail = {};
    //Validations
    if (Object.keys(collegeDetails).length === 0) {
      return res
        .status(400)
        .send({ status: false, message: "required some data" });
    }
    const { name, fullName, logoLink } = collegeDetails;
    console.log(name);
    if (typeof name === "undefined" || name === null || !name) {
      return res.status(400).send({
        status: false,
        message: "Please Enter name",
      });
    }
    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      !validName.test(name)
    ) {
      return res.status(400).send({
        status: false,
        message: "Please enter valid name",
      });
    }
    filteredCollegeDetail.name = name.trim().toLowerCase();
    if (typeof fullName === "undefined" || fullName === null || !fullName) {
      return res.status(400).send({
        status: false,
        message: "Please Enter fullName",
      });
    }
    if (typeof fullName !== "string" || fullName.trim().length === 0) {
      return res.status(400).send({
        status: false,
        message: "fullName's type must be string",
      });
    }
    filteredCollegeDetail.fullName = fullName
      .split(" ")
      .filter((el) => el.trim().length !== 0)
      .join(" ");

    if (typeof logoLink === "undefined" || logoLink === null || !logoLink) {
      return res.status(400).send({
        status: false,
        message: "Please Enter Logo link ",
      });
    }
    if (typeof logoLink !== "string" || logoLink.trim().length === 0) {
      return res.status(400).send({
        status: false,
        message: "logolink type must be string",
      });
    }
    if (!validateUrl(logoLink)) {
      return res
        .status(400)
        .send({ status: false, message: "Image url is not valid" });
    }
    filteredCollegeDetail.logoLink = logoLink.trim();

    //Checking if college already exist
    const findCollege = await collegeModel.findOne({
      name: filteredCollegeDetail.name,
    });
    if (findCollege) {
      return res
        .status(400)
        .send({ status: false, message: "College already exists" });
    }
    //If college is not already in DB then Registring new College
    const newCollege = await collegeModel.create(filteredCollegeDetail);
    return res.status(201).send({ status: true, data: newCollege });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};
//API for fetching college details with its interns detail
const getCollegeWithInterns = async function (req, res) {
  try {
    const collegeAbrv = req.query;
    if (Object.keys(collegeAbrv).length === 0 || !collegeAbrv.collegeName.trim()) {
      return res
        .status(400)
        .send({ status: false, message: "Please select name" });
    }
    if (!validName.test(collegeAbrv.collegeName.trim())) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please select valid name,can't have spaces, digit and wild character inside name",
        });
    }
    const validCollegeAbbrviation = collegeAbrv["collegeName"].trim().toLowerCase();
    //Fetching details of the college selected by query param
    const college = await collegeModel
      .findOne({ name: validCollegeAbbrviation, isDeleted: false })
      .select({ name: 1, fullName: 1, logoLink: 1 });
    if (!college) {
      return res
        .status(404)
        .send({ status: false, message: "College not found" });
    }
    //Fetching details of the selected college's undeleted intern
    const interns = await internModel
      .find({ collegeId: college._id, isDeleted: false })
      .select({ _id: 1, name: 1, email: 1, mobile: 1 });
    //if no intern found
    if (interns.length === 0) {
      return res.status(404).send({
        status: false,
        message: "interns with given college name not found",
      });
    }
    //If selected college having undeleted interns
    let collegeDetail = {
      name: college.name,
      fullName: college.fullName,
      logoLink: college.logoLink,
      interns: interns,
    };
    return res.status(200).send({ status: true, data: collegeDetail });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.createCollege = createCollege;
module.exports.getCollegeWithInterns = getCollegeWithInterns;
