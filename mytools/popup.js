// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
var isMy = true;

document.addEventListener('DOMContentLoaded', function () {
	MyToolsAgent.showTools()
})

var ToolsAgent = {
	exist: function(tools, id){
		if(!Array.isArray(tools) || tools.length <= 0){
			return false;
		}
		for (var i = 0; i < tools.length; i++) {
			if(tools[i].id == id){
				return true
			}
		}
		return false
	},
	get: function(tools, id){
		if(!Array.isArray(tools) || tools.length <= 0){
			return null;
		}
		for (var i = 0; i < tools.length; i++) {
			if(tools[i].id == id){
				return tools[i]
			}
		}
		return null
	},
	remove: function(tools, id){
		if(!Array.isArray(tools) || tools.length <= 0){
			console.log("not an array")
			return false;
		}
		var idx = -1
		for (var i = 0; i < tools.length; i++) {
			if(tools[i].id == id){
				idx = i;
				break;
			}
		}
		tools.splice(idx, 1);
		return true;
	}
}


var StoreAgent = {
	getTools: function(obj, callback){
		chrome.storage.sync.get(['my'], function(result) {
			if(result.my == undefined){
				obj.tools = []
			}else{
				obj.tools = result.my;
			}
			callback(result.my)
		});
	},
	setTools: function(tools){
		chrome.storage.sync.set({"my": tools}, function(){
			console.log('setTools success tools=', tools);
		})
	},
}

var MyToolsAgent = {
	tools: [],
	getTools: function(){
		return this.tools
	},
	addTool: function(tool){
		console.log("addTool tool=", tool)
		//检查是否已经存在
		if(ToolsAgent.exist(this.tools, tool.id)){
			return true;
		}
		//如不存在，则添加
		console.log(this.tools)
		this.tools.push(tool)
		StoreAgent.setTools(this.tools);
	},
	removeTool: function(id){
		console.log("removeTool id=", id)
		console.log("this.tools", this.tools)
		if(!ToolsAgent.exist(this.tools, id)){
			console.log("not exist")
			return false;
		}
		if(ToolsAgent.remove(this.tools, id)){
			StoreAgent.setTools(this.tools);
			return true;
		}
		return false;
	},
	showTools: function(){
		StoreAgent.getTools(this, function(tools){
			console.log("my tools", tools)
			if(!Array.isArray(tools) || tools.length <= 0){
				$("#myPanel").html("")
				var html = "<div class='pd-50'>还没有工具？<a href='#' id='go'>去市场看看</a></div>"
				$("#myPanel").append(html)
			}else{
				MyToolsAgent.show(tools)				
			}
		})
	},
	show: function(tools){
		console.log("show tools", tools)
		$("#myPanel").html("")
		if(!Array.isArray(tools) || tools.length <= 0){
			return;
		}
		for (var i = 0; i < tools.length; i++) {
			var myTemplate = '<div class="panel-element"><div class="panel-tag"><div class="collect tag-right" data-id="ID"><i class="fa fa-times" aria-hidden="true"></i></div></div><div class="panel-content"><a href="URL"><img src="IMG" alt="ALT" class="img-thumbnail"></a><div class="panel-row panel-title">TITLE</div></div></div>';
			var element = tools[i]
			var one = myTemplate.replace("URL", element.url).replace("IMG", element.img).replace("ALT", element.title).replace("TITLE", element.title).replace("ID", element.id)
			$("#myPanel").append(one)
		}
		addListener()
	},
	search: function(keyword){
		var searchTools = []
		for (var i = 0; i < this.tools.length; i++) {
			var tool = this.tools[i]
			if(tool.title.toLowerCase().indexOf(keyword.toLowerCase()) >= 0){
				console.log(tool.title)
				searchTools.push(tool)
			}
		}
		MyToolsAgent.show(searchTools)
	}
}

var MarketToolsAgent = {
	tools: [],
	getTools: function(){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://www.woainankai.com/static/market-test.json", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.response)
				MarketToolsAgent.tools = data.my
				MarketToolsAgent.showTools()
			}
		}
		xhr.send();
	},
	getTool: function(id){
		console.log("getTool id=", id)
		console.log("getTool tools=", this.tools)
		return ToolsAgent.get(this.tools, id)
	},
	showTools: function(){
		console.log("Market showTools", this.tools)
		MarketToolsAgent.show(this.tools)
	},
	show: function(tools){
		$("#marketPanel").html("")
		var myTools = MyToolsAgent.getTools()
		for (var i = 0; i < tools.length; i++) {
			var myTemplate = '<div class="panel-element"><div class="panel-tag"><div class="collect tag-right LIKE" data-id="ID"><i class="fa fa-heart" aria-hidden="true"></i></div></div><div class="panel-content"><a href="URL"><img src="IMG" alt="ALT" class="img-thumbnail"></a><div class="panel-row panel-title">TITLE</div></div></div>';
			var element = tools[i]
			var one = myTemplate.replace("URL", element.url).replace("IMG", element.img).replace("ALT", element.title).replace("TITLE", element.title).replace("ID", element.id)
			if(ToolsAgent.exist(myTools, element.id)){
				one = one.replace("LIKE", "ft-red")
			}else{
				one = one.replace("LIKE", "")
			}
			$("#marketPanel").append(one)
		}
		addListener()
	},
	search: function(keyword){
		var searchTools = []
		for (var i = 0; i < this.tools.length; i++) {
			var tool = this.tools[i]
			if(tool.title.toLowerCase().indexOf(keyword.toLowerCase()) >= 0){
				console.log(tool.title)
				searchTools.push(tool)
			}
		}
		console.log("Market search showTools", searchTools)
		MarketToolsAgent.show(searchTools)
	}
}




$("#search").focus()

$("#my").click(function(){
	showMyPanel()
})

$("#market").click(function(){
	showMarketPanel()
})

$("#about").click(function(){
	showAbout()
})


function showMyPanel(){
	isMy = true;
	$("#my").removeClass("bg-gray")
	$("#my").addClass("bg-white")
	$("#market").removeClass("bg-white")
	$("#market").addClass("bg-gray")
	$("#myPanel").removeClass("hidden")
	$("#marketPanel").removeClass("hidden")
	$("#marketPanel").addClass("hidden")
	$("#aboutPanel").removeClass("hidden")
	$("#aboutPanel").addClass("hidden")
	$(".search").removeClass("hidden")
	$("#search").focus()

	MyToolsAgent.showTools()
}

function showMarketPanel(){
	isMy = false;
	$("#market").removeClass("bg-gray")
	$("#market").addClass("bg-white")
	$("#my").removeClass("bg-white")
	$("#my").addClass("bg-gray")
	$("#marketPanel").removeClass("hidden")
	$("#myPanel").removeClass("hidden")
	$("#myPanel").addClass("hidden")
	$("#aboutPanel").removeClass("hidden")
	$("#aboutPanel").addClass("hidden")
	$(".search").removeClass("hidden")
	$("#search").focus()
	MarketToolsAgent.getTools()
}

function showAbout(){
	$("#myPanel").removeClass("hidden")
	$("#myPanel").addClass("hidden")
	$("#marketPanel").removeClass("hidden")
	$("#marketPanel").addClass("hidden")
	$("#aboutPanel").removeClass("hidden")
	$(".search").removeClass("hidden")
	$(".search").addClass("hidden")
}

$(document).keypress(function(e){
    if (e.which == 13){
        $("#searchBtn").click();
    }
});

$("#searchBtn").click(function(){
	var keyword = $.trim($("#search").val())
	if(keyword == null || keyword == "" || keyword == undefined){
		if(isMy){
			MyToolsAgent.showTools()
		}else{
			MarketToolsAgent.showTools()
		}
		return;
	}
	if(isMy){
		MyToolsAgent.search(keyword)
	}else{
		MarketToolsAgent.search(keyword)
	}
})

$(document).on("click", "#myPanel .collect", function(){
	var id = $(this).data("id")
	if(MyToolsAgent.removeTool(id)){
		MyToolsAgent.showTools()
	}else{
		console.log("remove tool error id=", id)
		alert("error")
	}
})

$(document).on("click", "#marketPanel .collect", function(){
	var id = $(this).data("id")
	var tool = MarketToolsAgent.getTool(id)
	if(tool == null){
		console.log("invalid id", id)
		alert("error")
		return;
	}
	MyToolsAgent.addTool(tool)
	$(this).addClass('ft-red')
})

$(document).on("click", "#go", function(){
	showMarketPanel()
})


function addListener(){
	var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function () {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function () {
                chrome.tabs.create({active: true, url: location});
            };
        })();
    }
}


