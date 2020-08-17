module.exports = class Student {
    constructor(username, password, satMath, satErwb, actComposite, numAPPassed, GPA) {
            this.username = username;
            this.password = password;
            this.GPA= GPA; 
            this.satMath = satMath;
            this.satErwb = satErwb;
            this.actComposite = actComposite;
            this.numAPPassed = numAPPassed;
         }

    setGPA(gpa){
        this.GPA = gpa;
    }

    getGPA(){
        return this.GPA;
    }

    setSatMath(satMath) {
        this.satMath = satMath;
    }

    getSatMath() {
        return this.satMath;
    }

    setSatErwb(satErwb) {
        this.satErwb = satErwb;
    }

    getSatErwb() {
        return this.satErwb;
    }

    setActComposite(actComposite) {
        this.actComposite = actComposite;
    }

    getActComposite() {
        return this.actComposite;
    }

    setNumAPPassed(numAPPassed) {
        this.numAPPassed = numAPPassed;
    }

    getNumAPPassed() {
        return this.numAPPassed;
    }

    getAcademicRating() {
        let studentSAT = (this.satMath + this.satErwb) / 1600;
        let studentACT = this.actComposite / 36;
        let studentGPA = this.GPA / 4.0;
        let studentAPPassed = this.numAPPassed / 24;
        return (studentSAT + studentACT + studentGPA + studentAPPassed) / 4;
    }
}