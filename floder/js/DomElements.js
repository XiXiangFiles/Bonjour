function add_button(Id,Class,Content,onclick){
	let tag;
	if(onclick==undefined)
		tag="<button "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</button>";
	else
		tag="<button "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\"+ onclick=\""+onclick+"\">"+Content+"</button>";
	return tag;
}
function add_select(Id,Class,Content){
	let tag="<select "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</select>";
	return tag;
}
function add_option(Value,Content){
	let tag="<option "+"value= "+"\""+Value+"\">"+Content+"</option>";
	return tag;
}
function add_div(Id,Class,Content){
	let tag="<div "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</div>";
	return tag;
}
function add_li(Id,Class,Content){
	let tag="<li "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</li>";
	return tag;
}
function add_p(Id,Class,Content){
	let tag="<p "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</p>";
	return tag;
}
function add_tr(Id,Class,Content){
	let tag="<tr "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</tr>";
	return tag;
}
function add_td(Id,Class,rowspan,Content){
	let tag;
	if (rowspan!=undefined)
		tag="<td "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\" rowspan=\""+rowspan+"\">"+Content+"</td>";
	else
		tag="<td "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</td>";
	
	return tag;
}
function add_h4(Id,Class,Content){
	let tag="<h4 "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</h4>";
	return tag;
}
function add_table(Id,Class,Content){
	let tag="<table "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</table>";
	return tag;
}
function add_thead(Id,Class,Content){
	let tag="<thead "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</thead>";
	return tag;
}
function add_tbody(Id,Class,Content){
	let tag="<tbody "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</tbody>";
	return tag;
}
function add_th(Id,Class,Content){
	let tag="<th "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</th>";
	return tag;
}
function add_span(Id,Class,Content){
	let tag="<span "+"id= "+"\""+Id+"\" "+"class="+"\""+Class+"\">"+Content+"</span>";
	return tag;
}
function add_a(Id,Class,Href,Content){
	let tag="<a "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\" href=\""+Href+"\">"+Content+"</a>";
	return tag;
}
function add_label(Id,Class,Content){
	let tag="<label "+"id= "+"\""+Id+"\""+" class="+"\""+Class+"\">"+Content+"</label>";
	return tag;
}
