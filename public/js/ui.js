$(document).ready( () => {

    $.ajax({
        url: "http://127.0.0.1:3000/highschoolnames",
        type: "GET",
        contentType: "application/json",
        dataType: "json",
        success:   (data,status,jQxhr) =>{
            for(highschoolname of data){
                $('#sel1').append(new Option(highschoolname, highschoolname));
            }
        } ,
        error: (jqXHR, textStatus, errorThrown) => { 
            alert("error obtaining high school names");
        }           
    });

    $('#collegeresults').on('change','.switch',function() {
        let collegename = $(this).parent().find('h5').text();
        if ($(this).find('.switch-input').is(':checked')) {
            $.ajax({
                url: "http://127.0.0.1:3000/addfavorite",
                type: "POST",
                data: JSON.stringify({collegename}),
                contentType: "application/json",
                dataType: "json",
                error: (jqXHR, textStatus, errorThrown) => { 
                    alert("update error");
                }           
            });
        }
        else {
           $.ajax({
                url: "http://127.0.0.1:3000/deletefavorite",
                type: "DELETE",
                data: JSON.stringify({collegename}),
                contentType: "application/json",
                dataType: "json",
                error: (jqXHR, textStatus, errorThrown) => { 
                    alert("update error");
                }           
            });
        }
    });

    $('#favoritecolleges').on('click','.close',function(){
        let collegename = $(this).parent().find('h5').text();
        $.ajax({
            url: "http://127.0.0.1:3000/deletefavorite",
            type: "DELETE",
            data: JSON.stringify({collegename}),
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                $(this).parent().remove();
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert("update error");
            }           
        });
    });

    $('#signout').click(function(){
        $.ajax({
            url: "http://127.0.0.1:3000/logout",
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                window.location.href = "./login.html";
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert("sign out error");
            }           
        });
    });

    $("#update").click(function(){
        let GPA = parseFloat(parseFloat($('#gpa').val()).toFixed(3));
        let numAPPassed = $('#aps').val();
        let satMath = $('#satM').val();
        let satErwb = $('#satE').val();
        let actComposite = $('#act').val();
        if(isNaN(GPA)){
            alert('GPA must be a number');
            return;
        }
        else if(GPA < 0.0 || GPA > 4.0){
                alert("GPA must be greater than 0.0 and less that 4.0");
                return;
        }
        if(numAPPassed.includes('.')){
            alert('APs passed must be a whole number');
            return;
        }
        else{
            numAPPassed = parseInt(numAPPassed,10);
            if(isNaN(numAPPassed)){
                alert("APs passed must be a whole number");
                return;
            }
            else if( numAPPassed < 0){
                alert('APs passed must be greater than or equal to zero');
                return;
            }
        }
        if(satMath.includes('.')){
            alert('satMath passed must be a whole number');
            return;
        }
        else{
            satMath = parseInt(satMath,10);
            if(isNaN(satMath)){
                alert("satMath must be a whole number");
                return;
            }
            else if( satMath < 200 || satMath > 800){
                alert('satMath must be between 200 and 800');
                return;
            }
        }
        if(satErwb.includes('.')){
            alert('satErwb passed must be a whole number');
            return;
        }
        else{
            satErwb = parseInt(satErwb,10);
            if(isNaN(satErwb)){
                alert("satErwb must be a whole number");
                return;
            }
            else if( satErwb < 200 || satErwb> 800){
                alert('satErwb must be between 200 and 800');
                return;
            }
        }
        if(actComposite.includes('.')){
            alert('actComposite passed must be a whole number');
            return;
        }
        else{
            actComposite = parseInt(actComposite,10);
            if(isNaN(actComposite)){
                alert("actComposite must be a whole number");
                return;
            }
            else if( actComposite < 1 || actComposite > 36){
                alert('actComposite must be between 1 and 36');
                return;
            }
        }
        $.ajax({
            url: "http://127.0.0.1:3000/updateaccount",
            type: "POST",
            data: JSON.stringify({GPA,numAPPassed,satErwb,satMath,actComposite}),
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                $.ajax({
                    url: "http://127.0.0.1:3000/getfavorites",
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success:   (data,status,jQxhr) =>{
                        $('#favecresults').empty();
                        let result = -1;
                        for(college of data){
                            college.admitRate = (college.admitRate * 100).toFixed(2) + "%";
                            college.completeRate = (college.completeRate * 100).toFixed(2) + "%";
                            college.acceptanceRate = (college.acceptanceRate * 100) + "%";
                            college.satMath = college.satMath ? college.satMath : `NA`;
                            college.satErwb = college.satErwb ? college.satErwb : "NA";
                            college.outstateTuition = college.outstateTuition ? college.outstateTuition : "NA";
                            college.instateTuition = college.instateTuition ? college.instateTuition : "NA";
                            college.ACT = college.ACT ? college.ACT : "NA";
                            $('#favecresults').append(`<div class="well search-result">
                            <button type="button" class="close" aria-label="Close" style="position: absolute; top: 0px; right: 0px; padding: 10px;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5>${college.name}</h5>
                            <p>State: ${college.state} <span class="tab"> Admission Rate: ${college.admitRate} <span class="tab">Completion Rate: ${college.completeRate} <span class="tab">Institution Type: ${college.institutionType}
                            <span class="tab"> In-state Tuition: ${college.instateTuition} <span class="tab"> Compatibility: ${college.acceptanceRate} <br>Out-of-State Tuition: ${college.outstateTuition} <span class="tab"> SAT Erwb: ${college.satErwb} <span class="tab"> SAT Math: ${college.satMath} <span class="tab">Average ACT: ${college.ACT} <span class="tab"> 
                            Population: ${college.size} <span class="tab"> Median Grad Debt: ${college.medianGradDebt} <span class="tab"> Location: ${college.location}</p>
                            <button type="button" class="btn btn-info" data-toggle="collapse" data-target="#Majors${result}">Majors</button>
                            <div id="Majors${result}" class="collapse">
                            </div>
                        </div>`);
                            for(major of college.majors){
                                $('#Majors'+result).append(`${major}<span class="tab2"> `)
                            }
                            result -= 1;
                        }
                        alert('Account has been updated');           
                    } ,
                    error: (jqXHR, textStatus, errorThrown) => { 
                        alert("error obtaining account info");
                    }           
                });
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert("update error");
            }           
        });
    });

    $('#nav-profile-tab').click(function(){
        $.ajax({
            url: "http://127.0.0.1:3000/account",
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                $('#username').val(data.username);
                $('#gpa').val(data.GPA);
                $('#aps').val(data.numAPPassed);
                $('#satM').val(data.satMath);
                $('#satE').val(data.satErwb);
                $('#act').val(data.actComposite);
                $.ajax({
                    url: "http://127.0.0.1:3000/getfavorites",
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success:   (data,status,jQxhr) =>{
                        $('#favecresults').empty();
                        let result = -1;
                        for(college of data){
                            college.admitRate = (college.admitRate * 100).toFixed(2) + "%";
                            college.completeRate = (college.completeRate * 100).toFixed(2) + "%";
                            college.acceptanceRate = (college.acceptanceRate * 100) + "%";
                            college.satMath = college.satMath ? college.satMath : `NA`;
                            college.satErwb = college.satErwb ? college.satErwb : "NA";
                            college.outstateTuition = college.outstateTuition ? college.outstateTuition : "NA";
                            college.instateTuition = college.instateTuition ? college.instateTuition : "NA";
                            college.ACT = college.ACT ? college.ACT : "NA";
                            $('#favecresults').append(`<div class="well search-result">
                            <button type="button" class="close" aria-label="Close" style="position: absolute; top: 0px; right: 0px; padding: 10px;">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5>${college.name}</h5>
                            <p>State: ${college.state} <span class="tab"> Admission Rate: ${college.admitRate} <span class="tab">Completion Rate: ${college.completeRate} <span class="tab">Institution Type: ${college.institutionType}
                            <span class="tab"> In-state Tuition: ${college.instateTuition} <span class="tab"> Compatibility: ${college.acceptanceRate} <br>Out-of-State Tuition: ${college.outstateTuition} <span class="tab"> SAT Erwb: ${college.satErwb} <span class="tab"> SAT Math: ${college.satMath} <span class="tab">Average ACT: ${college.ACT} <span class="tab"> 
                            Population: ${college.size} <span class="tab"> Median Grad Debt: ${college.medianGradDebt} <span class="tab"> Location: ${college.location}</p>
                            <button type="button" class="btn btn-info" data-toggle="collapse" data-target="#Majors${result}">Majors</button>
                            <div id="Majors${result}" class="collapse">
                            </div>
                        </div>`);
                            for(major of college.majors){
                                $('#Majors'+result).append(`${major}<span class="tab2"> `)
                            }
                            result -= 1;
                        }           
                    } ,
                    error: (jqXHR, textStatus, errorThrown) => { 
                        alert("error obtaining account info");
                    }           
                });
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert("error obtaining account info");
            }           
        });
    })

    $('#sel1').change(function() {
        let ranks = new Map([[1,'D-'], [2,'D'], [3,'D+'], [4,'C-'],
        [5,'C'], [6,'C+'], [7,'B-'], [8,'B'], [9,'B+'], [10,'A-'],
        [11,'A'], [12,'A+']]);
        $.ajax({
            url: `http://127.0.0.1:3000/highschool/${$(this).val()}`,
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                data.rank = ranks.get(data.rank);
                data.mathPro = (data.mathPro * 100) + "%";
                data.readPro = (data.readPro * 100) + "%";
                data.apPassRate = (data.apPassRate * 100) + "%";
                data.gradRate = (data.gradRate * 100) + "%";
                $('#highschoolresult').empty();
                $('#highschoolresult').append(`<div class="well search-result">
                                                    <h5>${data.name}</h5>
                                                    <p>APs Offered:${data.APS} <span class="tab"> Average ACT:${data.ACT} <span class="tab"> Average SAT:${data.SAT} <span class="tab"> Graduation Rate:${data.gradRate} <span class="tab"> AP Pass Rate:${data.apPassRate}
                                                    <span class="tab"> Location:${data.location}<span class="tab"> Math Proficiency:${data.mathPro} <br> Read Proficiency:${data.readPro}<span class="tab"> Rank:${data.rank}</p>
                                            </div>'`);
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert("error obtaining high school info");
            }           
        });
    });

    $("#search").keypress(function(e) { 
        if (e.keyCode === 13) { 
            e.preventDefault();
            let input = $(this).val();
            let highFirst = !$('#increasing').is(":checked");
            $.ajax({
                url: "http://127.0.0.1:3000/search",
                type: "POST",
                data: JSON.stringify({input, highFirst}),
                contentType: "application/json",
                dataType: "json",
                success:   (data,status,jQxhr) =>{
                    $('#collegeresults').empty();
                    let result = 1;
                    for(college of data){
                        college.admitRate = (college.admitRate * 100).toFixed(2) + "%";
                        college.completeRate = (college.completeRate * 100).toFixed(2) + "%";
                        college.acceptanceRate = (college.acceptanceRate * 100) + "%";
                        college.satMath = college.satMath ? college.satMath : `NA`;
                        college.satErwb = college.satErwb ? college.satErwb : "NA";
                        college.outstateTuition = college.outstateTuition ? college.outstateTuition : "NA";
                        college.instateTuition = college.instateTuition ? college.instateTuition : "NA";
                        college.ACT = college.ACT ? college.ACT : "NA";
                        let addition = `<div class="well search-result">`;
                        if(college.favorite){
                            addition += `<label class="switch float-sm-right">
                            <input class="switch-input" type="checkbox" checked/>
                            <span class="switch-label" data-on="Favorite" data-off="Unfavorite"></span> 
                            <span class="switch-handle"></span> 
                            </label>`;
                        }
                        else{
                            addition += `<label class="switch float-sm-right">
                            <input class="switch-input" type="checkbox"/>
                            <span class="switch-label" data-on="Favorite" data-off="Unfavorite"></span> 
                            <span class="switch-handle"></span> 
                            </label>`;
                        }
                        $('#collegeresults').append(addition +
                        `<h5>${college.name}</h5>
                        <p>State: ${college.state} <span class="tab"> Admission Rate: ${college.admitRate} <span class="tab">Completion Rate: ${college.completeRate} <span class="tab">Institution Type: ${college.institutionType}
                        <span class="tab"> In-state Tuition: ${college.instateTuition} <span class="tab"> Compatibility: ${college.acceptanceRate} <br>Out-of-State Tuition: ${college.outstateTuition} <span class="tab"> SAT Erwb: ${college.satErwb} <span class="tab"> SAT Math: ${college.satMath} <span class="tab">Average ACT: ${college.ACT} <span class="tab"> 
                        Population: ${college.size} <span class="tab"> Median Grad Debt: ${college.medianGradDebt} <span class="tab"> Location: ${college.location}</p>
                        <button type="button" class="btn btn-info" data-toggle="collapse" data-target="#Majors${result}">Majors</button>
                        <div id="Majors${result}" class="collapse">
                        </div>
                        </div>`);
                        for(major of college.majors){
                            $('#Majors'+result).append(`${major}<span class="tab2"> `)
                        }
                        result += 1;
                    }
                } ,
                error: (jqXHR, textStatus, errorThrown) => { 
                    alert("search error");
                }           
            });
        }
        else{

        } 
    }); 

})