const dashboard_settings = {
    show(dash_id) {
        var modal = document.getElementById("prefsmodal");
        modal.style.display = "block";

    },
    hide() {
        var modal = document.getElementById("prefsmodal");
        if (this.needs_refresh) {
            location.reload()
        }
        modal.style.display = "none";
    },
    update(event) {
        const checkboxes = ["header_visible", "settings_visible", "numbers_show_difference", "qrcode_visible", "subtimer_pass_fail", "timer_turn0"];
        var trig_str = event.target.id.substring(2);
        if(checkboxes.includes(trig_str)) {
            var trig_val = document.getElementById(event.target.id).checked;
        } else {
            var trig_val = $(event.target).val();
        }
        $.post("./updatepreferences", { "preference": trig_str, "value": trig_val })

        this.needs_refresh = true;
    },
    cssUpdate() {
        $.post("./updatecss", { "css": $("#styling_input").val() })
    },
    needs_refresh: false
}

$(document).ready(function () {
    $("#timer").load("/" + dash_id + "/timer/editor", function (response, status, xhr) {

    });
    $("#newsfeed").load("./newsfeed/editorload", function (response, status, xhr) {

    });
    $("#numbers").load("./numbers/editor", function (response, status, xhr) {

    });
    $("#subtimer").load("./subtimer/admin", function (response, status, xhr) {

    });
    loadAudio();
    dashboard_settings.needs_refresh = false
    if ($("#viewcontrol").css("display") == "block") {
        $(".slot_b").css("display", "none")
    }
});



window.onclick = function (event) {
    var modal = document.getElementById("prefsmodal");
    if (event.target == modal) {
        dashboard_settings.hide()
    }
}

function switchTab(new_tab) {
    $(".tabbtn").removeClass("clicked")
    $("#tab_" + new_tab).addClass("clicked")
    $(".slot").css("display", "none")
    $(".slot_" + new_tab).css("display", "block")
}

function changePrefsTab(event) {
    var new_tab = $(event.target).text();
    $(".selected_prefs").removeClass("selected_prefs")
    $(event.target).addClass("selected_prefs")
    $(".modal_tab_content").css("display", "none");
    $("#modal_tab_"+new_tab).css("display", "block");
}