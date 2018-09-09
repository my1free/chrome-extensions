// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
var isMy = true;
var hasAddBtn = false;

document.addEventListener('DOMContentLoaded', function () {
	// MyToolsAgent.showTools()
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

var PanelAgent = {
	panelList: ["myPanel", "bookmarkPanel", "marketPanel", "aboutPanel"],
	clearAllPanel: function(){
		$(".nav").find("li").removeClass("active")
		this.panelList.forEach(function(e, i){
			var $dom = $("#" + e)
			if(!$dom.hasClass("hidden")){
				$dom.addClass("hidden")	
			}
		})
	},
	showPannel: function(id){
		var $dom = $("#" + id + "Panel")
		if($("#" + id).hasClass("active")){
			return
		}
		this.clearAllPanel()

		$("#" + id).addClass("active")
		$("#" + id + "Panel").removeClass("hidden")
		$("#" + id + "Panel #search").val("")
		$("#" + id + "Panel #search").focus()
		bindEnter($("#" + id + "Panel #searchBtn"))
	}
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
	addDefinedTool: function(tool){
		console.log("addDefinedTool tool", tool)
		var tools = this.getTools()
		var maxId = 10000;
		for (var i = 0; i < tools.length; i++) {
			if(tools[i].id > maxId)
				maxId = tools[i].id
		}
		tool.id = maxId + 1
		tools.push(tool)
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
				$("#myPanel #content").html("")
				var html = "<div class='pd-50'>还没有工具？<a href='#' id='go' style='font-size:20px;'>去市场看看    > ></a></div>"
				$("#myPanel #content").append(html)
			}else{
				MyToolsAgent.show(tools)				
			}
		})
	},
	show: function(tools){
		console.log("show tools", tools)
		$("#myPanel #content").html("")
		if(!Array.isArray(tools) || tools.length <= 0){
			return;
		}
		for (var i = 0; i < tools.length; i++) {
			var myTemplate = '<div class="panel-element"><div class="panel-tag"><div class="collect tag-right" data-id="ID"><i class="fa fa-times" aria-hidden="true"></i></div></div><div class="panel-content"><a href="URL"><img src="IMG" alt="ALT" class="img-thumbnail"></a><div class="panel-row panel-title">TITLE</div></div></div>';
			var element = tools[i]
			var one = myTemplate.replace("URL", element.url).replace("IMG", element.img).replace("ALT", element.title).replace("TITLE", element.title).replace("ID", element.id)
			$("#myPanel #content").append(one)
		}
		var addBtn = '<div id="addNew" class="panel-element"><div class="panel-content"><a href="#"><img src="images/plus.png" alt="ALT" class="img-thumbnail"></a><div class="panel-row panel-title">添加</div></div></div>'
		$("#myPanel #content").append(addBtn)
		addListener()
	},
	search: function(keyword){
		var searchTools = []
		console.log("local tools", this.tools)
		for (var i = 0; i < this.tools.length; i++) {
			var tool = this.tools[i]
			if(tool.title.toLowerCase().indexOf(keyword.toLowerCase()) >= 0){
				console.log(tool.title)
				searchTools.push(tool)
			}
		}
		console.log("tools with keyword", searchTools)
		MyToolsAgent.show(searchTools)
	},
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
		$("#marketPanel #content").html("")
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
			$("#marketPanel #content").append(one)
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

var BookmarkAgent = {
	bookmarks: [],
	isTree: function(obj){
		if(obj.children == undefined){
			return false
		}
		return true
	},
	getTree: function(){
		BookmarkAgent.bookmarks = []
		chrome.bookmarks.getTree(function(bookmarkTree){
			//书签栏
			console.log("bookmarkTree", bookmarkTree)
			console.log("bookmarkTree[0]", bookmarkTree[0])
			console.log("bookmarkTree[0].children", bookmarkTree[0].children)
			var bookmarkBar = bookmarkTree[0].children[0].children
			console.log("bookmarkBar", bookmarkBar)
			bookmarkBar.forEach(function(ele, i){
				if(!BookmarkAgent.isTree(ele)){
					BookmarkAgent.bookmarks.push(ele)
				}else{
					BookmarkAgent.getNodesFromTree(ele)
				}
			})
			console.log("bookmarks", BookmarkAgent.bookmarks)

			//其他书签
			var bookmarkOther = bookmarkTree[0].children[1]
		})
	},
	getNodesFromTree: function(tree){
		if(!this.isTree(tree)){
			return
		}
		var nodes = tree.children
		nodes.forEach(function(ele, i){
			if(!BookmarkAgent.isTree(ele)){
				BookmarkAgent.bookmarks.push(ele)
				return
			}else{
				BookmarkAgent.getNodesFromTree(ele)
			}
		})
	},
	show: function(bookmarks){
		console.log("show bookmarks", bookmarks)
		$("#bookmarkPanel .list-group").html("")
		if(!Array.isArray(bookmarks) || bookmarks.length <= 0){
			return;
		}
		for (var i = 0; i < bookmarks.length; i++) {
			var myTemplate = '<a href="URL"><li class="list-group-item BG">TITLE</li></a>';
			var element = bookmarks[i]
			var one = myTemplate.replace("URL", element.url).replace("TITLE", element.title)
			if(i % 2 == 0){
				one = one.replace("BG", "list-group-item-success")
			}else{
				one = one.replace("BG", "list-group-item-info")
			}
			$("#bookmarkPanel .list-group").append(one)
		}
		addListener()
	},
	search: function(keyword){
		var bookmarks = []
		for (var i = 0; i < this.bookmarks.length; i++) {
			var bookmark = this.bookmarks[i]
			if(bookmark.title.toLowerCase().indexOf(keyword.toLowerCase()) >= 0){
				console.log(bookmark.title)
				bookmarks.push(bookmark)
			}
		}
		console.log("searched bookmarks", bookmarks)
		BookmarkAgent.show(bookmarks)
	}
}

$("#bookmark").click(function(){
	PanelAgent.showPannel("bookmark")
	BookmarkAgent.getTree()
})

$("#my").click(function(){
	PanelAgent.showPannel("my")
	MyToolsAgent.showTools()
})

$("#market").click(function(){
	PanelAgent.showPannel("market")
	MarketToolsAgent.getTools()
})

$("#about").click(function(){
	PanelAgent.showPannel("about")
})


$(document).on("change", "#addMore input[name=thumbnail]", function(){
	var thumbnail = $.trim($("#addMore input[name=thumbnail]").val());
	if(thumbnail == ""){
		thumbnail = "images/placeholder.jpg"
	}
	$("#addMore #img").attr("src", thumbnail)
})

$(document).on("click", "#myPanel #content #addNew", function(){
	if(hasAddBtn)
		return
	else
		hasAddBtn = true;
	var tt = '<div id="addMore" class="row"> \
        <div class="img img-thumbnail"><img id="img" src="images/placeholder.jpg" alt="ALT" class="img-thumbnail"></div> \
        <div class="content"> \
          <input type="text" class="form-control" name="title" placeholder="名称"> \
          <input type="text" class="form-control" name="thumbnail" placeholder="缩略图"> \
          <input type="text" class="form-control" name="url" placeholder="URL"> \
        </div> \
        <div style="text-align: right; margin-top: 2px;"> \
          <button style="margin-top: 5px;" id="save" type="submit" class="btn btn-success">保存</button> \
          <button style="margin-top: 5px;" id="cancel" type="submit" class="btn btn-warning">取消</button> \
        </div> \
      </div>'

    $("#myPanel #content").append(tt)
})

$(document).on("click", "#myPanel #content #save", function(){
	var title = $.trim($("#myPanel #content input[name=title]").val())
	var thumbnail = $.trim($("#myPanel #content input[name=thumbnail]").val())
	var url = $.trim($("#myPanel #content input[name=url]").val())
	if(title == "" || title == undefined
		|| thumbnail == "" || thumbnail == undefined
		|| url == "" || url == undefined)
		return
	var tool = {}
	tool.title = title
	tool.img = thumbnail
	tool.url = url
	MyToolsAgent.addDefinedTool(tool)
	MyToolsAgent.showTools()
	hasAddBtn = false;
})

$(document).on("click", "#myPanel #content #cancel", function(){
	hasAddBtn = false;
	MyToolsAgent.showTools()
})

function bindEnter($dom){
	$(document).keydown(function(e){
	    if (e.which == 13){
	        $dom.click();
	    }
	});
}

$("#bookmarkPanel #searchBtn").click(function(){
	var keyword = $.trim($("#bookmarkPanel #search").val())
	console.log("bookmark search. keyword", keyword)
	if(keyword == null || keyword == "" || keyword == undefined){
		BookmarkAgent.show([])
		return
	}
	BookmarkAgent.search(keyword)
})

$("#myPanel #searchBtn").click(function(){
	var keyword = $.trim($("#myPanel #search").val())
	console.log("my search", keyword)
	if(keyword == null || keyword == "" || keyword == undefined){
		MyToolsAgent.showTools()
		return
	}
	MyToolsAgent.search(keyword)
})

$("#marketPanel #searchBtn").click(function(){
	var keyword = $.trim($("#marketPanel #search").val())
	if(keyword == null || keyword == "" || keyword == undefined){
		MarketToolsAgent.showTools()
		return
	}
	MarketToolsAgent.search(keyword)
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
	PanelAgent.showPannel("market")
	MarketToolsAgent.getTools()
})


function addListener(){
	var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function () {
            var ln = links[i];
            var location = ln.href;
            console.log(location)
            if(location.endsWith("#")){
            	return
            }
            ln.onclick = function () {
                chrome.tabs.create({active: true, url: location});
            };
        })();
    }
}

init()

function init(){
	PanelAgent.showPannel("my")
	$("#myPanel #search").focus()
	MyToolsAgent.showTools()
}



