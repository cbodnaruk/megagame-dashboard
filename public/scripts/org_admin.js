const new_dash = '<div class="flex_buttons"><input class="dash_listing" type="text" id="l_dnew" value="d..." disabled=""><span> <button class="material-symbols-outlined adminbtn" id="e_dnew" onclick="editDash(event)">edit</button></span><span> <button class="material-symbols-outlined adminbtn" id="c_dnew" onclick="cancelEditDash(event)" style="display: none">close</button></span><span> <button class="adminbtn material-symbols-outlined" id="d_dnew" onclick="deleteDash(event)">delete</button></span><span><button class="adminbtn material-symbols-outlined" id="v_dnew" onclick="visitDash(event)">open_in_new</button></span></div>'

function logout() {
  $.post('./org/logout', function (data) {
    window.location.replace('/')
  })
}

function checkId(id) {
  var letnum = /^[a-z0-9]+$/
  return (id.slice(0, 1) == "d" && letnum.test(id))
}

function checkUniqueDashId(id) {
  var dash_list = []
  for (x in dashes) {
    dash_list.push(dashes[x].dash_id)
  }
  console.log(dash_list)
  console.log(dash_list.includes(id))
  return (!dash_list.includes(id))
}

function editDash(event) {
  var dash_id = event.target.id.split('_')[1]
  var btn_txt = $(`#e_${dash_id}`).text()
  var new_id = $(`#l_${dash_id}`).val()
  if (btn_txt == "edit") {
    $(`#l_${dash_id}`).prop('disabled', false)
    $(`#l_${dash_id}`).focus()
    $(`#e_${dash_id}`).text("check")
    $(`#c_${dash_id}`).show()
    $(`#d_${dash_id}`).hide()
  } else if ($(`#e_${dash_id}`).text() == "check") {
    if (!checkId(new_id)) {
      alert("Dashboard ID must start with 'd' and contain no special characters.")
    } else if (!checkUniqueDashId(new_id)) {
      alert(`Dashboard ID ${new_id} is already taken.`)

    } else if (confirm(`Are you sure you want to change dashboard '${dash_id}' to '${new_id}'?`)) {
      $(`#e_${dash_id}`).text("edit")
      $(`#l_${dash_id}`).prop('disabled', true)
      $.post('./org/dash_update', { "new_id": new_id, "old_id": dash_id })
      $(`#c_${dash_id}`).hide()
      $(`#d_${dash_id}`).show()

      //refresh
      $(".loading_modal").show()
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    }
  }
}

function cancelEditDash(event) {
  var dash_id = event.target.id.split('_')[1]
  var btn_txt = $(`#e_${dash_id}`).text()
  if (dash_id == "dnew") {
    $(event.target).parent().parent().remove()
  } else {
    if ($(`#e_${dash_id}`).text() == "check") {
      $(`#l_${dash_id}`).val(dash_id)
      $(`#c_${dash_id}`).hide()
      $(`#e_${dash_id}`).text("edit")
      $(`#l_${dash_id}`).prop('disabled', true)
      $(`#d_${dash_id}`).show()
    }

  }
}

function deleteDash(event) {
  var dash_id = event.target.id.split('_')[1]
  if (prompt(`Please re-enter the dashboard ID (${dash_id}) to confirm deletion. This is PERMANENT.`) == dash_id) {
    if (confirm("Are you sure? Any settings or newsfeed history will be lost.")) {
      $.post('./org/delete', { "dash_id": dash_id })
      //refresh
      $(".loading_modal").show()
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }
}

function newDash() {
  $("#dash_list").append(new_dash)
  $("#e_dnew").trigger("click")

}

function visitDash(event) {
  var dash_id = event.target.id.split('_')[1]
  window.open(`/${dash_id}`)
}

function changePassword() {
  $("#old_pw_box").css('top', '0')
  $("#modal_layer").show()
}

window.onclick = function (event) {
  var modal = document.getElementById("modal_layer");
  if (event.target == modal) {
    $(modal).hide()
    $("#old_pw_box").css('top', '100%')
    $("#new_pw_box").css('top', '100%')
    $("#success_pw_box").css('top', '100%')
  }
}

function progressPassword() {
  //check password
  $.post('./org/changepassword/check', { "old": $("#old_pw").val() }, (data) => {
    if (data === true) {
      $("#old_pw_box").css('top', '100%')
      $("#new_pw_box").css('top', '0')
    } else {
      $("#old_pw_label").text("Password Incorrect")
      $("#old_pw_label").css('color', 'red')
    }
  })

}

function savePassword() {
  //save password


  $.post('./org/changepassword/change', { "new": $("#new_pw").val() }, (data) => {
    if (data === true) {
      $("#new_pw_box").css('top', '100%')
      $("#success_pw_box").css('top', '0')

      setTimeout(() => {
        $("#success_pw_box").css('top', '100%')
      }, 1500)
    } else {
      alert("Unable to change password at this time, try again later.")
    }
  })
}

function showPW() {
  $("#eyebtn").text("visibility_off")
  $("#new_pw").prop('type', 'text')
  $("#old_pw").prop('type', 'text')
}

function hidePW() {
  $("#eyebtn").text("visibility")
  $("#new_pw").prop('type', 'password')
  $("#old_pw").prop('type', 'password')
}

function editFile(event) {
  var raw_filename = event.target.getAttribute("data-name")
  var filename = raw_filename.replace(".", "\\.")
  if ($(event.target).text() == "edit") {

    $(`#n_${filename}`).hide()
    $(`#e_${filename}`).show()
    $(event.target).text("check")
  } else {
    if (checkFile($(`#e_${filename}`).val())) {
      $(event.target).text("edit")
      $(`#e_${filename}`).hide()
      $(`#n_${filename}`).show()
      $(`#n_${filename}`).text($(`#e_${filename}`).val())
      $.post('./org/renamefile', { "file": raw_filename, "new": $(`#e_${filename}`).val() })
    } else {
      alert("File name invalid: must only contain a-Z 0-9, -, _, ., (no spaces) and include a file extension.")
    }

  }

}

function checkFile(filename) {
  return /^[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]+$/i.test(filename)
}

function uploadFile(e) {
  var filename = $("#file_input_box").val().replace(" ","_")
  var files = document.getElementById("file_input_box").files
  for (i in files) {
    if (checkFile(files[i].name)) {
        files[i].name = files[i].name.replace(" ","_")
      var form_data = new FormData();
      form_data.append("file", files[i])
      $.ajax(
        {
          url: './org/uploadfile',
          data: form_data,
          processData: false,
          contentType: false,
          type: "POST"
        })
      //draw new bar
      $("#file_list").append(newFileBox(files[i].name))

    }
    $("#file_input_box").val("")

  }
}

function newFileBox(name) {
  return `<div class="file_listing"> <span> <a class="file_link" href="./assets/demo/${name}" id="n_${name}">${name}</a><input class="file_edit" id="e_${name}" value="${name}"></span><span> <span class="cp_url material-symbols-outlined" onclick="navigator.clipboard.writeText('/assets/demo/${name}');">content_copy</span><span class="cp_url material-symbols-outlined" data-name="${name}" onclick="editFile(event)">edit</span><span class="cp_url material-symbols-outlined" data-name="${name}" onclick="deleteFile(event)">delete</span></span></div>`
}

function deleteFile(event) {
  var raw_filename = event.target.getAttribute("data-name")
  var filename = raw_filename.replace(".", "\\.")
  if (confirm(`Are you sure you want to delete the file ${raw_filename}?`)) {
    $.post('./org/deletefile', { "file": raw_filename })
    $(event.target).parent().parent().remove()
  }
}

function updateNotes(e) {
  $.post('./org/updatenotes', { "file": e.target.id.split("_")[1], "notes": $(e.target).val() })
}