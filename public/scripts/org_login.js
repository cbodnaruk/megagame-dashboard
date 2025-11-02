function login(){
    // post password
    var org_name =  $("#org_select").val()
    var pw = $("#org_pw").val()
    $.post("./login",{ "org": org_name, "pw": pw }, function( data ){
        window.location.replace(data)
    })
}

window.addEventListener("DOMContentLoaded", (event) => {
    var input = document.getElementById("org_pw");
    input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            login()
        }
    })
    });