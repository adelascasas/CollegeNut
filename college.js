module.exports = class College {
    
    constructor(name, admitRate,instateTuition, outstateTuition, score, institutionType, medianGradDebt, state, location, size, satMath, satErwb, ACT, completeRate, majors) {
        this.name = name;
        this.admitRate = admitRate;
        this.instateTuition = instateTuition;
        this.outstateTuition = outstateTuition;
        this.score = score;
        this.institutionType = institutionType;
        this.medianGradDebt = medianGradDebt;
        this.state = state;
        this.location = location; 
        this.size = size;
        this.satMath = satMath;
        this.satErwb = satErwb;
        this.ACT = ACT;
        this.completeRate = completeRate;
        this.majors = majors;
    }

    setName(name){
        this.name = name;
    }

    getName(){
        return this.name;
    }

    setAdmitRate(admitRate){
        this.admitRate = admitRate;
    }

    setInstateTuition(instateTuition){
        this.instateTuition = instateTuition;
    }

    setOutstateTuition(outstateTuition){
        this.outstateTuition = outstateTuition;
    }

    setScore(score){
        this.score = score;
    }

    setInstitutionType(institutionType){
        this.institutionType = institutionType;
    }

    setMedianGradDebt(medianGradDebt){
        this.medianGradDebt = medianGradDebt;
    }

    /**
     * Sets the state of this college and its region/location by createing
     *  a mapping between the state and the location/region that this college 
     *  belongs to. 
     * @param {*} state 
     */
    setState(state){
        this.state = state;
        let regions = new Map([ ['AK','W'],['AL','S'],['AR','S'],['AZ','W'],
        ['CA','W'],['CO','W'],['CT','NE'],['DC','S'],['DE','S'],['FL','S'],
        ['GA','S'],['HI','W'],['IA','MW'],['ID','W'],['IL','MW'],['IN','MW'],
        ['KS','MW'],['KY','S'],['LA','S'],['MA','NE'],['MD','S'],['ME','NE'],
        ['MI','MW'],['MN','MW'],['MO','MW'],['MS','S'],['MT','W'],['NC','S'],
        ['ND','MW'],['NE','MW'],['NH','NE'],['NJ','NE'],['NM','W'],['NV','W'],
        ['NY','NE'],['OH','MW'],['OK','S'],['OR','W'],['PA','NE'],['RI','NE'],
        ['SC','S'],['SD','MW'],['TN','S'],['TX','S'],['UT','W'],['VA','S'],
        ['VT','NE'],['WA','W'],['WI','MW'],['WV','S'],['WY','W']]);
        this.location = regions.get(state);
    }

    getState(){
        return this.state;
    }

    setSize(size){
        this.size = size;
    }

    setSatMath(satMath){
        this.satMath = satMath;
    }

    setSatErwb(satErwb){
        this.satErwb = satErwb;
    }
    
    setACT(ACT){
        this.ACT = ACT;
    }

    setCompleteRate(completeRate){
        this.completeRate = completeRate;
    }

    setMajors(majors){
        this.majors = majors;
    }

    getMajors(){
        return this.majors;
    }

    acceptanceRate(student) {
        let SAT1 = this.satMath + this.satErwb;
        let ACT1 = this.ACT;
        let SAT2 = student.satMath + student.satErwb;
        let ACT2 = student.actComposite;
        if (SAT1 == 0 || SAT2 == 0) {
            SAT1 = 0;
            SAT2 = 0;
        }
        if (ACT1 == 0 || ACT2 == 0) {
            ACT1 = 0;
            ACT2 = 0;
        }
        let myScore = (SAT1/1600 + ACT1/36) / 2;
        let score1 = (SAT2 / 1600 + ACT2 / 36) / 2;
        return parseFloat((1 - (Math.max(myScore, score1) - Math.min(myScore, score1))).toFixed(2));
    }
}
    