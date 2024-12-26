"use strict";

const fs = require("fs")
const Fuse = require("fuse.js")

function writeLog(data, path) {
    fs.appendFileSync(path, JSON.stringify(data) + "\n");
}

function clean(value) {
    // Define the regex pattern to match unwanted words and symbols
    const pattern = /\b(hotels?|resorts?|collection|groups?|&)\b|[^a-zA-Z0-9\s]/gi;
    // Remove matches from the string
    let cleanedString = value.replace(pattern, "");
    // Remove extra spaces
    return cleanedString.trim().replace(/\s+/g, " ").toLowerCase();
}

const listings = fs.readFileSync("./listings/london.jsonl", {
    encoding: "utf8",
    flag: "r",
});

const hotels = fs.readFileSync("./listings/hotels.json", {
    encoding: "utf8",
    flag: "r",
});

const options = {
    keys: ["hotel"],
    includeScore: true,
    threshold: 0.1,
    distance: 100,
    ignoreLocation: true,
};

const fuse = new Fuse(JSON.parse(hotels), options);

function match(key) {
    if (!key || !key.toString().length) return null;
    return fuse.search(key)?.sort((a, b) => b - a)?.[0];
}

for (const data of JSON.parse(listings)) {
    const matchWebsite = data.website !== "null" ? match(clean(data.website)) : null;
    const matchHotel = match(clean(data.hotel_name));
    const matchGroup = data.group_name !== "null" ? match(clean(data.group_name)) : null;
    const matchChainsAndBrands = data.chains_and_brands !== "null" ? match(clean(data.group_name)) : null;

    if (!matchHotel && !matchWebsite && !matchGroup && !matchChainsAndBrands) {
        writeLog(data, "./results/unmatched.jsonl")
        continue;
    }

    console.log(matchHotel, matchWebsite, matchGroup)

    const result = {
        sheet_hotel: data.hotel_name,
        sheet_group: data.hotel_name,
        ...(matchChainsAndBrands?.item ?? matchGroup?.item ?? matchWebsite?.item ?? matchHotel?.item),
    }

    writeLog(result, "./results/matched.jsonl")

}