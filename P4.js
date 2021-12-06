var canvas;
var gl;
var program;

var numTimesToSubdivide = 3;
var image;
var index = 0;
var positionsArray = [];
var colorsArray = [];
var normalsArray = [];
var sType = 1.0;
var near = -40;
var far = 40;
var radius = 1.5;
var theta = 0.0;
var phi = 0.0;
var dr = 15.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var earthX = (va[0] + vb[0] + vc[0], + vd[0]) / 4;
var earthY = (va[1] + vb[1] + vc[1], + vd[1]) / 4;
var earthZ = (va[2] + vb[2] + vc[2], + vd[2]) / 4;

var earthDia;
var earthRad;
var earthTheta = 0.0;
var earchPhi = 0.0;
var moonRad;
var moonTheta = 0.0;
var moonPhi = 0.0;

var lightPosition = vec4(-1.0, 0.0, 0.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(0.0, 0.0, 0.8, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var nMatrix, nMatrixLoc;

var colorEarth = vec3(0.0, 0.0, 0.8);

var eye = vec3(0.0, 0.0, 1.5);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

function planetDiameter(a, b, c) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var norm = normalize(cross(t2, t1));
    
    earthRad = Math.sqrt(Math.pow(norm[0], 2) + Math.pow(norm[1], 2) + Math.pow(norm[2], 2));
    earthDia = 2*earthRad;
}

function configureTexture( imag ) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, imag);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
}

function triangle(a, b, c) {
    positionsArray.push(a);
    positionsArray.push(b);
    positionsArray.push(c);
    
    // normals are vectors

    normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0],c[1], c[2], 0.0));

    index += 3;
}


function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    planetDiameter(va, vb, vc);
    moonRad = earthDia * 4;
    radius = moonRad * 4;

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    document.getElementById("Button0").onclick = function(){radius *= 2.0;};
    document.getElementById("Button1").onclick = function(){radius *= 0.5;};
    document.getElementById("Button2").onclick = function(){theta += dr;};
    document.getElementById("Button3").onclick = function(){theta -= dr;};
    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};

    document.getElementById("Controls").onclick = function(event) {
        switch(event.target.index) {
          case 0:
            sType = 0.0;
            break;

         case 1:
            sType = 1.0;
            break;

         case 2:
            sType = 2.0;
            break;
        }

        normalsArray = [];
        nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
        normalLoc = gl.getAttribLocation(program, "aNormal");
        gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc); //senidng normals over
        if(sType == 2.0){
            jiimage = document.getElementById("texImage");
            configureTexture(image);
        }
    };

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"),materialShininess);
    render();
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    earthTheta += 15.0 * Math.PI/180.0;
    moonTheta += 0.75 * Math.PI/180.0;
    
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniform3fv( gl.getUniformLocation(program, "uEyePosition"), eye );
    
    ctm = mat4();
    ctm = mult(ctm, rotateY(earthTheta));
    var earthView = mult(modelViewMatrix, ctm);
   
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(earthView));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniform1f( gl.getUniformLocation(program,"usType"),sType );
    
    for(var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 ); //Earth is 768 vertices
 
    ctm = mat4();
    ctm = mult(ctm, scale(0.25, 0.25, 0.25));
    ctm = mult(ctm, rotateY(moonTheta));
    ctm = mult(ctm, translate(moonRad, 0, moonRad));
    var moonView = mult(modelViewMatrix, ctm);
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(moonView));
    
    for(var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 ); //Moon is 768 vertices
    
    requestAnimationFrame(render);
}
