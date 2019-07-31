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
                    orientation = EXIF.getTag(this, "Orientation");
                    $("#rotation").html(" Orientation: " + orientation);
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
        $.post("/upload", { imagedata: $('#preview').attr("src") }, function(data) {
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
            alert("On existing");
            filelist();
        }
    });



});




function filelist() {
    alert("Loading");
    $("#loading").removeClass("d-none");
    $.getJSON("/imagelist", function(data) {
        var items = [];
        $.each(data, function(key, val) {
            items.push("<tr>");
            items.push("<td>" + key + "</td>");
            items.push("<td>" + val["LastModified"] + "</td>");
            items.push("<td>" + val["Size"] + "</td>");
            items.push("</tr>");
        });

        $("#files").html(items.join(""));
        $("#loading").addClass("d-none");
    });
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