
var DateTime = luxon.DateTime;
function submitPost() {
    var post_text = $("#postinput").val();
    var now = DateTime.now()
    $.post("./newsfeed/postcreate", { "text": post_text, "time": now.toLocaleString(DateTime.TIME_SIMPLE) }, reloadNewsfeed());
    console.log(now.toLocaleString(DateTime.TIME_SIMPLE))
}
function reloadNewsfeed() {
    $("#newsfeed").load("./newsfeed/editorload", function (response, status, xhr) {

    });
}

function deletePost(post_id) {
    if (confirm("Please confirm delete post") == true) {
        $.post("./newsfeed/postdelete", { "id": post_id }, reloadNewsfeed())
    }
}

function beginEdit(post_id) {
    const this_post = document.getElementById(post_id + "p");
    const x = document.getElementsByClassName("edit");
    const edit_button = x.namedItem(post_id);
    const y = document.getElementsByClassName("post_delete");
    const delete_button = y.namedItem(post_id);
    delete_button.outerHTML = "";
    edit_button.innerHTML = "Save Edit";
    edit_button.setAttribute("onClick", "endEdit(this.id)");
    const current_text = this_post.children.item(0).innerHTML
    this_post.children.item(0).outerHTML = "<textarea id='editinput' name='editinput' cols='45' rows='6' maxlength='255' placeholder='Write post here'>" + current_text + "</textarea>";

}

function endEdit(post_id) {

    var post_text = $("#editinput").val();
    //send update
    if (confirm("Please confirm edit") == true) {
        $.post("./newsfeed/postupdate", { "id": post_id, "text": post_text }, reloadNewsfeed())
    }
    else {
        reloadNewsfeed()

    }

}