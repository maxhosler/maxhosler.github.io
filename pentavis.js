"use strict";

var canvas;
var gl;
var body;

var points = [];
var colors = [];

var shapelist = [];
var shapelens = [];

var pt1;
var pt2;
var pt3;
var ghost;

var follower = -1;

var width;
var scale = 0.9;
const pent = [
    vec3( scale,                 0.0,     1.0 ),
    vec3( scale* 0.30901, scale* 0.95105, 1.0 ),
    vec3( scale*-0.80901, scale* 0.58778, 1.0 ),
    vec3( scale*-0.80901, scale*-0.58778, 1.0 ),
	vec3( scale* 0.30901, scale*-0.95105, 1.0 ),
];

const vertexColors = [
    [ 0.0, 0.0, 0.0, 1.0 ], //Black   0
    [ 1.0, 0.0, 0.0, 1.0 ], //Red     1
    [ 1.0, 1.0, 0.0, 1.0 ], //Yellow  2
    [ 0.0, 1.0, 0.0, 1.0 ], //Green   3
    [ 0.0, 0.0, 1.0, 1.0 ], //Blue    4
    [ 1.0, 0.0, 1.0, 1.0 ], //Magenta 5
    [ 0.0, 1.0, 1.0, 1.0 ], //Cyan    6
    [ 1.0, 1.0, 1.0, 1.0 ]  //White   7
	[ 0.5, 0.5, 0.5, 1.0 ]  //Gray    8
];

const pentColors = [
    [ 0.0, 0.0, 0.0, 1.0 ], //Black   0
    [ 1.0, 0.0, 0.0, 1.0 ], //Red     1
    [ 1.0, 1.0, 0.0, 1.0 ], //Yellow  2
    [ 0.0, 1.0, 0.0, 1.0 ], //Green   3
    [ 0.0, 0.0, 1.0, 1.0 ], //Blue    4
];

var quad = [
    pent[1],
    pent[2],
    pent[3],
    pent[4],
];

window.onload = function init() {
	
	//GL SETUP
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    pentagon();
		
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	pt1 = gl.getUniformLocation(program, "pt1");
	pt2 = gl.getUniformLocation(program, "pt2");
	pt3 = gl.getUniformLocation(program, "pt3");
	
	ghost = gl.getUniformLocation(program, "ghost");
	
    render();
	
	//HTML setup
	
	width = gl.canvas.width;
	body = document.getElementById( "body" );
	
	canvas.addEventListener('mousedown', mousedown, false);
	canvas.addEventListener('mousemove', mousemove, false);
	
	body.addEventListener('mouseup', mouseup, false);

}

function pentagon() {
	for ( var i = 0; i < pent.length; ++i ) {
        point(i,i);
    }
    for ( var i = 0; i < pent.length; ++i ) {
		line(i,(i+1)%pent.length,4);
    }
}

function point(idx,col) {

    points.push( pent[idx] );
    colors.push( vertexColors[col] );

	shapelist.push(gl.POINTS);
	shapelens.push(1);
}

function line(idx1, idx2, col) {
	var indices = [ idx1,idx2 ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( pent[indices[i]] );
        colors.push( pentColors[col]    );
    }
	
	shapelist.push(gl.LINES);
	shapelens.push(2);
}

function render() {
		
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.uniform1f(ghost,1.0);
	set_to_trans();
	render_wt();
	
	gl.uniform1f(ghost,0.4);
	set_to_ident();
	render_wt();

}

function render_wt() {
	var idx = 0;
	for( var i = 0; i < shapelist.length; ++i ){
		gl.drawArrays(shapelist[i], idx, shapelens[i]);
		idx += shapelens[i];
	}
}

function set_to_ident(){
	
	gl.uniform3fv(pt1,vec3(1.0,0.0,0.0));
	gl.uniform3fv(pt2,vec3(0.0,1.0,0.0));
	gl.uniform3fv(pt3,vec3(0.0,0.0,1.0));
	
}

function set_to_trans(){
	
	var pquad = [pent[1],pent[2],pent[3],pent[4]];
	
	var iq3 = mat3( [quad[0][0], quad[1][0], quad[2][0],
					 quad[0][1], quad[1][1], quad[2][1],
					 quad[0][2], quad[1][2], quad[2][2] ] );
	var wq = vmult(inverse(iq3),quad[3])
	var iq  = mat3( [wq[0]*quad[0][0], wq[1]*quad[1][0], wq[2]*quad[2][0],
					 wq[0]*quad[0][1], wq[1]*quad[1][1], wq[2]*quad[2][1],
					 wq[0]*quad[0][2], wq[1]*quad[1][2], wq[2]*quad[2][2] ] );
					 
	var ip3 = mat3( [pquad[0][0],pquad[1][0],pquad[2][0],
					 pquad[0][1],pquad[1][1],pquad[2][1],
			         pquad[0][2],pquad[1][2],pquad[2][2]] );
	var wp = vmult(inverse(ip3),pquad[3])
	var ip  = mat3( [wp[0]*pquad[0][0], wp[1]*pquad[1][0], wp[2]*pquad[2][0],
					 wp[0]*pquad[0][1], wp[1]*pquad[1][1], wp[2]*pquad[2][1],
					 wp[0]*pquad[0][2], wp[1]*pquad[1][2], wp[2]*pquad[2][2] ] );
		
	var pq = mult( iq, inverse(ip));
	
	gl.uniform3fv(pt1,vec3(pq[0]));
	gl.uniform3fv(pt2,vec3(pq[1]));
	gl.uniform3fv(pt3,vec3(pq[2]));
	
}

function vmult(M,x){
		
	var x0 = vec3(M[0][0],M[1][0],M[2][0]);
	var x1 = vec3(M[0][1],M[1][1],M[2][1]);
	var x2 = vec3(M[0][2],M[1][2],M[2][2]);
	
	return add( add( smult( x[0],x0 ), smult( x[1],x1 )), smult( x[2],x2 ))
	
}

function smult(s,x){
	return vec3( s*x[0], s*x[1], s*x[2]);
	
}

function homonorm(v){
	
	return smult( 1/v[2], v);
	
}

//HTML functions

function mousedown(e){
	
	var x = 2*e.x/width -1;
	var y = 1- 2*e.y/width ;
	
	const d = 1/20;
	
	follower = -1;
	for(var i=0; i<4; i++){
		let a = Math.abs(quad[i][0]-x);
		let b = Math.abs(quad[i][1]-y);
				
		if(a<d&&b<d){
			follower = i;
			console.log(i);
			break;
		}
	}
}

function mousemove(e){
	
	var x = 2*e.x/width -1;
	var y = 1- 2*e.y/width ;
	
	if(follower > -1){
		quad[follower] = vec3(x,y,1);
	}
	
	render();
}

function mouseup(e){
	
	follower=-1;
}