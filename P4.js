// Nola Watson & Anthony Scarpa
// CSC 350
// Project 4

var canvas;
var gl;
var program;
var earthRate = 15;
var moonRate = 0.75;
var earthImg;
var moonImg;

var numTimesToSubdivide = 4;
var image;
var index = 0;
var positionsArray = [];
var colorsArray = [];
var normalsArray = [];
var sType = 1.0;
var near = -40;
var far = 40;
var radius;
var theta = 0.0;
var phi = 0.0;
var dr = 15.0 * Math.PI/180.0;
var cameraFlag = 1.0;
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

var earthTheta = earthRate * Math.PI/180.0;
var moonTheta = moonRate * Math.PI/180.0;

var lightPosition = vec4(-10.0, 0.0, 0.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0); //light source properties
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(0.0, 0.0, 0.8, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0); //properties for earth
var materialShininess = 20.0;

var moonMaterialAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var moonMaterialDiffuse = vec4(0.8, 0.8, 0.8, 1.0); //properties for moon
var moonMaterialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var moonMaterialShininess = 30.0;

var ctm, ctmLoc;
var ambientColor, diffuseColor, specularColor;
var ambientProduct, specularProduct, diffuseProduct;
var moonAmbientProduct, moonSpecularProduct, moonDiffuseProduct; 

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var nMatrix, nMatrixLoc;

var starwars = false;
var sound;
var playing = false;

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

function planetDiameter(a, b, c) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var norm = normalize(cross(t2, t1)); //planet diameter calculator
    
    earthRad = Math.sqrt(Math.pow(norm[0], 2) + Math.pow(norm[1], 2) + Math.pow(norm[2], 2));
    earthDia = 2*earthRad;
}

function triangle(a, b, c) {
    positionsArray.push(a);
    positionsArray.push(b); //trangle function from shadedSphere.js
    positionsArray.push(c);
    
    // normals are vectors

    normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0],c[1], c[2], 0.0));
    colorsArray.push(vec3(0, 0, 0.8));
    colorsArray.push(vec3(0, 0, 0.8));
    colorsArray.push(vec3(0, 0, 0.8)); //this version pushes blue to the colors array
    index += 3;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);   //divideTriangle function from shadedSphere.js
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1); //recursively calls itself "numTimestoSubDivide" amount of times
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

function triangle2(a, b, c) {
    positionsArray.push(a);
    positionsArray.push(b);
    positionsArray.push(c);
    

    normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0],c[1], c[2], 0.0));
    colorsArray.push(vec3(0.8, 0.8, 0.8)); //all of the "2" functions are the same as their counterparts, they are just tailored for the moon's gray color
    colorsArray.push(vec3(0.8, 0.8, 0.8));
    colorsArray.push(vec3(0.8, 0.8, 0.8));
}

function divideTriangle2(a, b, c, count) {
    if (count > 0) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle2(a, ab, ac, count - 1);
        divideTriangle2(ab, b, bc, count - 1);
        divideTriangle2(bc, c, ac, count - 1);
        divideTriangle2(ab, bc, ac, count - 1);
    }
    else {
        triangle2(a, b, c);
    }
}

function tetrahedron2(a, b, c, d, n) {
    divideTriangle2(a, b, c, n);
    divideTriangle2(d, c, b, n);
    divideTriangle2(a, d, b, n);
    divideTriangle2(a, c, d, n);
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

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    moonAmbientProduct = mult(lightAmbient, moonMaterialAmbient);
    moonDiffuseProduct = mult(lightDiffuse, moonMaterialDiffuse);
    moonSpecularProduct = mult(lightSpecular, moonMaterialSpecular);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    tetrahedron2(va, vb, vc, vd, numTimesToSubdivide);

    planetDiameter(va, vb, vc);

    moonRad = 4 * earthDia;
    radius = moonRad * 4;
    lightPosition[0] = -1 * radius; //getting radius of orbit and diamater of the Earth

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

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
    ctmLoc = gl.getUniformLocation(program, "uCtm");

    document.getElementById("Button0").onclick = function(){cameraFlag = 1.0;};
    document.getElementById("Button1").onclick = function(){cameraFlag = 0.0;};
    document.getElementById("Button2").onclick = function(){
        moonRate *= 2.0;
        earthRate *= 2.0;
    };
    document.getElementById("Button3").onclick = function(){
        moonRate = moonRate / 2.0;
        earthRate = earthRate / 2.0;
    };

    document.getElementById("Button4").onclick = function(){
        moonTheta = moonTheta + moonRate * (0.75 * Math.PI/180.0);
        earthTheta = earthTheta + moonRate * (15 * Math.PI/180.0);
    };


    // Texture stuff
    document.getElementById("Button5").onclick = function(){
        earthImg = document.getElementById("alderaanImg");
        moonImg = document.getElementById("deathstarImg");
        sound = document.getElementById("dundunDUN");
        if (playing == true) {
            sound.pause();
            playing = false;
        } else {
            sound.play();
            playing = true;
        }
    }
    earthImg = document.getElementById("earthImg");
    moonImg = document.getElementById("moonImg");

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Controlls
    document.getElementById("Controls").onclick = function(event) {
        switch(event.target.index) {
          case 0:
            sType = 0.0;
            document.getElementById("Button5").style.visibility = 'hidden';
            break;

         case 1:
            sType = 1.0;
            document.getElementById("Button5").style.visibility = 'hidden';
            break;

         case 2:
            sType = 2.0;
            document.getElementById("Button5").style.visibility = 'visible';
            break;
        }
    };

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"),materialShininess);
    gl.uniform4fv(gl.getUniformLocation(program,
        "ulightSpecular"),flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program,
        "ulightAmbient"),flatten(lightAmbient));
    gl.uniform4fv(gl.getUniformLocation(program,
        "ulightDiffuse"),flatten(lightDiffuse));
    render();
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 0.95);
    earthTheta += earthRate * Math.PI/180.0;
    moonTheta += moonRate * Math.PI/180.0;
    
    if (cameraFlag == 1.0){ //if they want the camera level
        eye = vec3(0, 0, radius);
    }
    else if(cameraFlag == 0.0){ //else
        eye = vec3(0, Math.sin(60 * Math.PI/180) * radius, Math.cos(60 * Math.PI/180) * radius);
    }
    
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniform3fv( gl.getUniformLocation(program, "uEyePosition"), eye );
    
    ctm = mat4();
    ctm = mult(ctm, rotateY(earthTheta));
    //var earthView = mult(modelViewMatrix, ctm);
   
    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(earthView));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
    gl.uniform1f( gl.getUniformLocation(program,"usType"),sType );
  
    // Set earth image
    if (sType == 2) { //if texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, earthImg);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    }

    if(sType == 1){ //if they want phong shading
        gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),flatten(diffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),flatten(specularProduct));
        gl.uniform1f(gl.getUniformLocation(program, "uShininess"),materialShininess);
    }

    for(var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 ); //Render Earth
 
    ctm = mat4();
    ctm = mult(ctm, scale(0.25, 0.25, 0.25));
    ctm = mult(ctm, rotateY(moonTheta));
    ctm = mult(ctm, translate(moonRad, 0, moonRad)); //transformations for the moon
    //var moonView = mult(modelViewMatrix, ctm);
    
    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(moonView));
    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
    
    // Set moon image
    if (sType == 2) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, moonImg);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    }

    if(sType == 1){
        gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),flatten(moonAmbientProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),flatten(moonDiffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),flatten(moonSpecularProduct));
        gl.uniform1f(gl.getUniformLocation(program, "uShininess"),materialShininess);
    }

    for(var i=index; i<index*2; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 ); //Render Moon
    
    requestAnimationFrame(render);
}
