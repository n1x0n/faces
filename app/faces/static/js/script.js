/* Script */
$(document).ready(function() {
    /* Activate the image selector functionality */
    $('#imageselector').change(function() {
        var file = document.querySelector('input[type=file]').files[0];
        var reader = new FileReader();

        reader.addEventListener("load", function() {
            var image = new Image();
            var degrees = 0;
            image.onload = function() {
                EXIF.getData(image, function() {
                    var orientation = EXIF.getTag(this, "Orientation");
                    switch (orientation) {
                        case 3:
                            degrees = 180;
                            break;
                        case 6:
                            degrees = 90;
                            break;
                        case 8:
                            degrees = 270;
                            break;
                    }
                });
                alert("Degrees: " + degrees);
                resizeImage(reader.result, 480, degrees, function(newurl) {
                    $('#preview').attr("src", newurl);
                    $("#uploaderror").addClass("d-none");
                    $('#photoclicker').addClass("d-none");
                    $('#preview').removeClass("d-none");
                    $('#submitbutton').removeClass("d-none");
                });
            };
            image.src = reader.result;
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    });


    /* Activate the upload button */
    $("#submitbutton").click(function() {
        $("#submitbutton").addClass("d-none");
        $("#uploadspinner").removeClass("d-none");
        $("#preview").addClass("imagedesat");
        $.post("/api/upload", { imagedata: $('#preview').attr("src") }, function(data) {
            if (parseInt(data) > 0) {
                $('[href="#existing"]').tab('show');
            } else {
                $("#uploaderror").removeClass("d-none");
            }
            $("#uploadspinner").addClass("d-none");
            $('#preview').addClass("d-none");
            $("#preview").removeClass("imagedesat");
            $('#preview').attr("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
            $('#photoclicker').removeClass("d-none");
        });
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        var currentTab = $(e.target).attr("id");
        console.log(currentTab);
        if (currentTab == "existing-tab") {
            filelist();
        }
    });


    $.getJSON("/api/appmeta", function(data) {
        var appname = data.appname;
        var applogo = data.applogo;
        $("#applogo").on("load", function() {
            $("#appinfo").fadeIn();
        });
        $("#applogo").attr("src", applogo);
        $("#appname").html(appname);
    });

    $('#imageinfo').on('show.bs.modal', function(event) {
        var row = event.relatedTarget;
        var base64 = row.dataset.base64;
        $.getJSON("/api/imageurl/" + base64, function(data) {
            $("#selfie").on("load", function() {
                $("#selfieloading").addClass("d-none");
                $("#selfiediv").removeClass("d-none");
            });
            var url = data;
            $("#selfie").attr("src", atob(url));
        });
        $.getJSON("/api/imagemeta/" + base64, function(data) {
            var html = "";
            if (data) {
                var items = [];
                $.each(data, function(key, val) {
                    items.push('<tr>');
                    items.push("<td>" + key + "</td>");
                    items.push("<td>" + val + "</td>");
                    items.push('</tr>');
                });
                html = items.join("");
            }
            if (html == "") {
                html = "<p>No metadata found.</p>";
            }
            $("#metadata").html(html);
            $("#metaloading").addClass("d-none");
            $("#metadiv").removeClass("d-none");
        });
    });

    $('#imageinfo').on('hidden.bs.modal', function(event) {
        $("#selfie").off("load");
        $("#selfiediv").addClass("d-none");
        $("#selfieloading").removeClass("d-none");
        $("#metadiv").addClass("d-none");
        $("#metadata").html("");
        $("#metaloading").removeClass("d-none");
        $('#selfie').attr("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
    });

});




function filelist() {
    $("#loading").removeClass("d-none");
    $.getJSON("/api/imagelist", function(data) {
        var items = [];
        var objects = {};
        $.each(data, function(key, val) {
            var dummy = {
                Key: key,
                LastModified: val.LastModified,
                Size: val.Size,
                base64: val.base64
            };
            objects[key] = dummy;
        });

        var keys = Object.keys(objects);
        keys.sort();
        keys.reverse();

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = objects[key];
            items.push('<tr class="imagerow" data-toggle="modal" data-target="#imageinfo" data-base64="' + val.base64 + '">');
            items.push("<td>" + key + "</td>");
            items.push("<td>" + shortDate(val.LastModified) + "</td>");
            items.push("<td>" + bytesToSize(val.Size) + "</td>");
            items.push("</tr>");
        }


        $("#files").html(items.join(""));
        $("#loading").addClass("d-none");
    });
}


function shortDate(datestring) {
    var date = new Date(datestring);
    return (date.toLocaleString());
}


function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}


function resizeImage(url, size, degrees, callback) {
    var sourceImage = new Image();

    sourceImage.onload = function() {
        // Create a canvas with the desired dimensions
        var canvas = document.createElement("canvas");

        var scaleX = 1;
        var scaleY = 1;
        var drawx = 0;
        var drawy = 0;

        if (degrees == 90 || degrees == 270) {
            canvas.width = sourceImage.height;
            canvas.height = sourceImage.width;
            drawx = Math.round(canvas.height / 2) * -1;
            drawy = Math.round(canvas.width / 2) * -1;
            scaleX = size / sourceImage.height;
            scaleY = scaleX;
        } else {
            canvas.width = sourceImage.width;
            canvas.height = sourceImage.height;
            drawx = Math.round(canvas.width / 2) * -1;
            drawy = Math.round(canvas.height / 2) * -1;
            scaleX = size / sourceImage.width;
            scaleY = scaleX;
        }

        // Scale to right dimensions
        canvas.height = Math.round((canvas.height / canvas.width) * size);
        canvas.width = size;
        var ctx = canvas.getContext("2d");
        ctx.setTransform(scaleX, 0, 0, scaleY, Math.round(canvas.width / 2), Math.round(canvas.height / 2));
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(sourceImage, drawx, drawy);

        // Convert the canvas to a data URL in PNG format
        callback(canvas.toDataURL());
    };

    sourceImage.src = url;
}