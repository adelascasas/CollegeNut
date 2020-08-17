module.exports = class HighSchool {

    constructor(name, rank, SAT, ACT, APS, location, gradRate, apPassRate, mathPro, readPro) {
        this.name = name;
        let ranks = new Map([['D-', 1], ['D', 2], ['D+', 3], ['C-', 4],
        ['C', 5], ['C+', 6], ['B-', 7], ['B', 8], ['B+', 9], ['A-', 10],
        ['A', 11], ['A+', 12]]);
        this.rank = ranks.get(rank);
        this.SAT = isNaN(SAT) ? 0 : SAT;
        this.ACT = isNaN(ACT) ? 0 : ACT;
        this.APS = isNaN(APS) ? 0 : APS;
        this.location = location
        this.gradRate = gradRate;
        this.apPassRate = apPassRate;
        this.mathPro = mathPro;
        this.readPro = readPro;
    }
}