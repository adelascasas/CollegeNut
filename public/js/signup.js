$(document).ready( () => {

    $('#signup').click(function(e){
        e.preventDefault();
        let username = $('#userid').val();
        let password = $('#pwd').val();
        $.ajax({
            url: "http://127.0.0.1:3000/createaccount",
            type: "POST",
            data: JSON.stringify({username,password}),
            contentType: "application/json",
            dataType: "json",
            success:   (data,status,jQxhr) =>{
                window.location.href = "./login.html";
            } ,
            error: (jqXHR, textStatus, errorThrown) => { 
                alert(jqXHR.responseJSON.error);
            }           
        });
    })

})