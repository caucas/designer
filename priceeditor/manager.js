$.ajax({
	url: "priceeditor/editors.html",
	success:function(r,s){
		$.zan = {};
		$("body").append(r);
		$(".schlangadd").click(function(){ schlangadd_click(this) });
		$("#schLang").submit(function(){ return schLang_submit() });
		$("#changeFolder").submit(function(){ return changeFolder_submit() });
		$("#confirmMessage").submit(function(){ return confirmMessage_submit() });
		$("#changeElement").submit(function(){ return changeElement_submit() });
		$('#changeElement').on('show.bs.modal', function (event) {
			$("#changeElement").find("[type=submit]").attr("disabled", null);
		});
		$('#changeElement').on('shown.bs.modal', function (event) {
			$("#changeElement input[type=text]:first").focus();
			addimage($(".uploadbtn2"));
		});
		$('#changeElement').on('hide.bs.modal', function (event) {
			$("[name=uploadfile]").remove();
		});
		$('#changeFolder').on('shown.bs.modal', function (event) {
			$("#changeFolder input[type=text]:first").focus();
		});
		var menuid = location.href.substr(location.href.indexOf("#")+1);
		dpd.menu.get(menuid, function(m, em){
			if (em) return console.log("error [priceeditor/manager.js:123] ", em);
			dpd.pricetree.get({cafe: m.cafe}, function(pt,pte){
				if (pte) return console.log("error [priceeditor/manager.js:125] ", pte);
				if (pt.length === 0) return console.log("error [priceeditor/manager.js:14] pricetree not found cafe.id=", m.cafe);
				$.zan.tree = pt[0];
				dpd.cafe.get(pt[0].cafe, function(c,ce){
					if (ce) return console.log("error [priceeditor/manager.js:129] ", ce);
					$.zan.deflanguage = c.deflanguage;
					$.zan.languages = c.languages;
					$.zan.cafe = c.id;
				});
			});
		});
		dpd.currency.get(function(r,e){
			if (e) return console.log(e);
			for (var i = 0; i < r.length; i++){
				$("#changeElementFormСurrency").append("<option value='"+r[i].id+"'>"+st(r[i].name)+"</option>");
			}
		});
		dpd.dimension.get(function(r,e){
			if (e) return console.log(e);
			for (var i = 0; i < r.length; i++){
				$("#changeElementFormDimension").append("<option value='"+r[i].id+"'>"+st(r[i].name)+"</option>");
			}
		});
	}
});

//Дописать перевод текста
function st(t){
	return t;
}

function setPriceEditManager($item, key, media){
	$item.dblclick(function(){ showEditor(this); });
	$item.mouseover(function(event){
		event.stopPropagation();
		$(this).prepend( $(".edit-icons").remove() );
		$(".edit-icons").show();
	});
	$item.mouseout(function(event){
		event.stopPropagation();
		$(".edit-icons").hide();
	});
	$item.attr("zan-price-id", key);
	$item.attr("zan-isdir", "false");
	if (typeof media === 'undefined') $item.attr("zan-isdir", "true");
}

function schlangadd_click(self){
	$.zan.chrow = $(self).parent().parent();
	$("#ChaField").val($.zan.chrow.find("[type=hidden]").attr('id'));
	$(".edrow").text($.zan.chrow.find("label").text());	
	if ($.zan.chrow.find("textarea").length===0){
		$('#cha_lngs_list_tpl').tmpl($.zan.languages, {}).appendTo($('#cha_lngs_list').empty());
		var deflangtrans = $.zan.chrow.find("input[type=text]").val();	
	}
	else{
		$('#cha_lngs_text_list_tpl').tmpl($.zan.languages, {}).appendTo($('#cha_lngs_list').empty());
		var deflangtrans = $.zan.chrow.find("textarea").val();
	}
	var trs = JSON.parse($.zan.chrow.find("input[type=hidden]").val());
	for (i in trs){
		$("#cha_lngs_list").find("."+i).find(".clearinput").val(trs[i]);
		$("#cha_lngs_list").find("."+i).find(".tid").val(i);
	}
	$("#cha_lngs_list").find("."+$.zan.deflanguage).find(".clearinput").val(deflangtrans);
	$("#schLang").modal('show');
}

function schLang_submit(){
	var trs = $("#cha_lngs_list").find("tr");
	var arr = {};
	for (var i = 0; i < trs.length; i++){
		var lid = $(trs[i]).attr("id");
		var ltr = $(trs[i]).find(".clearinput").val();
		var tid = $(trs[i]).find(".tid").val();
		if (lid === $.zan.deflanguage){
			$("#"+$("#ChaField").val().replace('Langs','')).val(ltr);
		}
		if (ltr!=="") arr[lid] = ltr;
	}
	$("#"+$("#ChaField").val()).val(JSON.stringify(arr));
	$("#schLang").modal('hide');
	return false;
}

function changeFolder_submit(){
	var id = $("#changeFolderFormId").val()
	  , name = $("#changeFolderFormName").val().trim()
	  , desc = $("#changeFolderFormDesc").val()
	  , lngsdesc  = JSON.parse($("#changeFolderFormDescLangs").val())
	  , lngsnames = JSON.parse($("#changeFolderFormNameLangs").val());
	
	if (name === ""){
		alert(st("Введите название"));
		return false;
	}
	
	lngsnames[$.zan.deflanguage] = name;
	lngsdesc[$.zan.deflanguage] = desc;
		
	var tname = lngsnames;
	var tdesc = lngsdesc;
	
	if (id===""){	//Добавление папки
		var vetka = { name: name, description: desc, tname: tname, tdesc: tdesc, order: [], children: [], id: uuid.v4() };
		var ctree = getTree($.zan.tree.tree, $.zan.curfolder);
		ctree.children.push(vetka);
		saveTree();
				
		showNewFolder($.zan.curfolder, vetka);
		$("#changeFolder").modal('hide');
		return false;
	}
	
	var ctree = getTree($.zan.tree.tree, id);
	ctree.name = name;
	ctree.description = desc;
	ctree.tname = tname;
	ctree.tdesc = tdesc;
	$("body").append( $(".edit-icons").remove() );
	$("#mrow_"+id).find(".name").text(name);
	saveTree();
	$("[zan-price-id="+id+"]").text(name);
	$("#changeFolder").modal('hide');
	return false;
}

function confirmMessage_submit(){
	var id = $("#confirmMessageDelId").val();
	
	//get parent
	var pid = $("[zan-price-id="+id+"]").parent().parent().find("[zan-price-id]:first").attr("zan-price-id");
	if ($("[zan-price-id="+id+"]").parent().parent().hasClass("pd-price-service")) pid = "0";
	console.log(pid);
	
	var isdir = $("[zan-price-id="+id+"]").attr("zan-isdir");
	
	$("body").append( $(".edit-icons").remove() );
	$("[zan-price-id="+id+"]").parent().remove();
	
	if (isdir === "true"){
		removeFormTree($.zan.tree.tree, id, false);
	}
	else{
		dpd.price.del(id);
		if (pid!==0){
			var tr = getTree($.zan.tree.tree, pid);
			var i = tr.order.indexOf(id);
			tr.order.splice(i, 1);
		}
	}
	saveTree();
	$("#confirmMessage").modal('hide');
	return false;
}

function showEditor(pid){
	console.log(pid);
	var id = $(pid).attr("zan-price-id");
	
	if ($(pid).attr("zan-isdir")==="true") 
		editCategory(id);
	else 
		editItem(id);
}

function editCategory(id){
	var dir = getTree($.zan.tree.tree, id);
	console.log(dir);
	$("#changePriceModalLabel").text(st("Редактирование папки"));
	$("#changeFolderFormName").val(dir.name);
	$("#changeFolderFormDesc").val(dir.description);
	$("#changeFolderFormNameLangs").val(JSON.stringify(dir.tname));
	$("#changeFolderFormDescLangs").val(JSON.stringify(dir.tdesc));
	$("#changeFolderFormId").val(dir.id);
	$("#changeFolder").modal();
}

function getNextLevel(folder){
	if (folder.hasClass("pd-price-service-level-0")) return 1;
	if (folder.hasClass("pd-price-service-level-1")) return 2;
	if (folder.hasClass("pd-price-service-level-2")) return 3;
	if (folder.hasClass("pd-price-service-level-3")) return 4;
	return 4;
}

function showNewFolder(parent_folder, folder){
	var f = $("[zan-price-id="+parent_folder+"]").parent();
	var np = $("<div/>");
	np.addClass("pd-price-service-level");
	np.addClass("pd-price-service-level-collapsed");
	np.addClass("pd-price-service-level-"+getNextLevel(f));
	np.css("display", "block");
	np.append('<div class="pd-price-service-level-icon"></div>');
	
	var pr = $("<div/>");
	pr.addClass("pd-price-service-item");
	pr.addClass("pd-price-service-category");
	setPriceEditManager(pr, folder.id);
	np.append(pr);
	
	$(f.children()[1]).after(np);
	$("[zan-price-id="+folder.id+"]").text(folder.name);
	
	var createDragObject = (function(template, price_) {
		var f = function() {
			var $item = $('<div/>').pdWsItem({
				model : {
					type : 'template',
					config : {
						price : price_,
						template : template
					}
				}
			});
			return $item;
		};
		return f;
	}('link'+getNextLevel(f), folder.id));
	pr.pdDraggable({
		dragObject : createDragObject
	});
	pr.on('click', function(e) {
		var $item = $(this);
		var $level = $item.parent();
		if ($level.hasClass('pd-price-service-level-collapsed')) {
			$level.children('.pd-price-service-level').slideDown('normal')
			$level.removeClass('pd-price-service-level-collapsed');
		} else {
			$level.children('.pd-price-service-level').slideUp('normal')
			$level.addClass('pd-price-service-level-collapsed');
		}
	});
	
	if (f.hasClass("pd-price-service-level-collapsed")){ f.children()[1].click(); }
}

function showNewPrice(parent_folder, price){
	var f = $("[zan-price-id="+parent_folder+"]").parent();
	var np = $("<div/>");
	np.addClass("pd-price-service-level");
	np.addClass("pd-price-service-level-"+getNextLevel(f));
	np.css("display", "block");
	var pr = $("<div/>");
	pr.addClass("pd-price-service-item");
	setPriceEditManager(pr, price.id, 1);
	np.append(pr);
	f.append(np);
	$("[zan-price-id="+price.id+"]").text(price.name);
	
	var createDragObject = (function(template, price_) {
		var f = function() {
			var $item = $('<div/>').pdWsItem({
				model : {
					type : 'template',
					config : {
						price : price_,
						template : template
					}
				}
			});
			return $item;
		};
		return f;
	}('default', price.id));
	pr.pdDraggable({
		dragObject : createDragObject
	});
	
	if (f.hasClass("pd-price-service-level-collapsed")){ f.children()[1].click(); }
}

function changeElement_submit(){
	$("body").append( $(".edit-icons").remove() );
			
	var name = $("#changeElementFormName").val().trim()
	  , desc = $("#changeElementFormDesc").val()
	  , cost = $("#changeElementFormCost").val()
	  , currency = $("#changeElementFormСurrency").val()
	  , count = $("#changeElementFormCount").val()
	  , dimension = $("#changeElementFormDimension").val()
	  , id = $("#changeElementFormId").val()
	  , fresh = document.getElementById('changeElementFormFresh').checked
	  , active = document.getElementById('changeElementFormActive').checked
	  , lngsdesc  = JSON.parse($("#changeElementFormDescLangs").val())
	  , lngsnames = JSON.parse($("#changeElementFormNameLangs").val())
	  , images = $("#changePriceFormImgs img")
	  , media = []
	  , curid = ""
	  , curmedia = $.zan.curmedia;
	  
	if (name === ""){
		alert(st("Введите название"));
		return false;
	}
	
	$("#changeElement").find("[type=submit]").attr("disabled", "disabled");
	
	for (var i = 0; i < images.length; i++){
		url = clearUrl($(images[i]).attr("src")).replace("_small","");
		media.push(url);
		if (curmedia.indexOf(url) < 0)
			dpd.file.post({cafe:$.zan.cafe, name:$(images[i]).attr("title"), url: url, type:"price", owner: curid});
	}
	
	var rimages = $("#remImgs .rimage");
	for (var j = 0; j < rimages.length; j++)
		removeFromUrl($(rimages[j]).text());
	
	lngsnames[$.zan.deflanguage] = name;
	lngsdesc[$.zan.deflanguage] = desc;
	
	var tname = lngsnames;
	var tdesc = lngsdesc;
	
	var priceUpdate = {cost:cost, currency: currency, count: count, dimension: dimension, media:media, fresh:fresh, active:active, tname:tname, tdescription:tdesc};
	
	if (id===""){	//Добавление новой номенклатуры
		priceUpdate.cafe = $.zan.cafe;
		priceUpdate.parent = $.zan.curfolder;
		dpd.price.post(priceUpdate, function(np, e){
			//Добавление в order текущей папки id новой записи !!! (в конец)
			var folder = getTree($.zan.tree.tree, $.zan.curfolder);
			if (!folder.order) folder.order = [];
			folder.order.push(np.id);
			saveTree();
			np.name = name;
			$("#changeElement").modal("hide");
			showNewPrice($.zan.curfolder, np);
		});
		return false;
	}
	
	var price = app.getPriceService().get(id);
	console.log(price)
	console.log(name)
	$.extend(true, price, priceUpdate);
	price.name = name;
	dpd.price.put(id, priceUpdate, function(np, e){
		if (e) {
			$("#changeElement").modal("hide");
			console.log(e);
			return false;
		}
		$("[zan-price-id="+id+"]").text(name);
		$("#changeElement").modal("hide");
	});
	return false;
}

function editItem(id){
	dpd.price.get(id, {r:Math.random()}, function(r,e){
		if (e) return console.log("error [priceeditor/manager.js:159] ", e);
		console.log(r);
		$("#changeElementModalLabel").text(st("Редактирование номенклатуры"));
		$("#changeElementFormName").val(r.name);
		$("#changeElementFormDesc").val(r.description);
		$("#changeElementFormNameLangs").val(JSON.stringify(r.tname));
		$("#changeElementFormDescLangs").val(JSON.stringify(r.tdescription));
		$("#changeElementFormCost").val(r.cost);
		$("#changeElementFormCount").val(r.count);
		$("#changeElementFormСurrency").val(r.currency);
		$("#changeElementFormDimension").val(r.dimension);
		$("#changeElementFormId").val(id);
		document.getElementById('changeElementFormFresh').checked = r.fresh;
		document.getElementById('changeElementFormActive').checked = r.active;
		var url = r.media;
		$.zan.curmedia = r.media;
		$("#changePriceFormImgs, #remImgs").html("");
		if (url.length!==0){
			for (var i = 0; i < url.length; i++)
				setimg($("#changePriceFormImgs"), url[i], "");
			$(".selbtn").hide();
		}
		else {
			$(".selbtn").show();
		}
		
		$("#changeElement").modal();
	});
}

function addimage(btn){
	if ($("[name=uploadfile]").length!==0){
		$("[name=uploadfile]").remove();
	}
	new AjaxUpload(btn, {
		action: '/s3bucket',
		data:{curuser:app.getUser().id, curcafe:$.zan.cafe},
		name: 'uploadfile',
		onSubmit: function(file, ext){
			if (! (ext && /^(jpg|png|jpeg|gif)$/.test(ext))){ 
				alert(st('Поддерживаются только JPG, PNG или GIF'));
				return false;
			}
			btn.parent().find(".imgview").append("<img class='gifloader' src='/img/loader.gif'>");
			$(".selbtn").hide();
		},
		onComplete: function(file, response){
			var t = btn.parent().find(".imgview");
			var files = $(response).find(".file");
			setimg(t, $(files[0]).find(".url").text()+"_small", $(files[0]).find(".name").text());
		}
	});
}	

function removeImg(event, self){
	if (event) event.stopPropagation();
	var div = $(self).parent().parent().parent();
	var url = $(self).parent().find("img").attr("src");
	if (div.find("#remImgs").length!==0){
		div.find("#remImgs").append("<div class='rimage'>"+url+"</div>");
	}
	else{
		removeFromUrl(url);
	}
	$(self).parent().remove();
	$(".selbtn").show();
}

function showImg(self){
	$('<div class="cc" style="position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 19000; background-color: black; opacity: 0.5;"></div>').appendTo("body");
	var d = $("<img />").
		addClass("ccimg").addClass("cc").
		attr("src", $(self).attr("src").replace("_small","")).
		appendTo("body");
	$(".cc").click(function(){
		$(".cc").remove();
	});
}

function setimg(t, url, title){
	var div = $("<div/>").css("display","inline-block");
	var img = $("<img onclick='showImg(this)' />").attr("src", url.replace("_small","")+"_small?q=1").attr("title",title);
	div.append(img);
	t.find(".gifloader").remove();
	div.append($('<span class="zglyphicon zglyphicon-remove pos-right" onclick="removeImg(event, this)" title="'+st('Удалить')+'"></span>'));
	t.append(div);
	setTimeout(function(){					
		var src = t.find("img:last").attr("src")+"1";
		if (src.length-src.indexOf("?")>10) return;	//максимум 10 запросов
		t.find("img:last").attr("src", src);
		if (t.find("img:last").height() < 21)
			setTimeout(arguments.callee, 1000);
		else{
			addimage(t.parent().find(".selbtn"));
			$(".selbtn").show();
		}
	}, 1000);	
}

function changeClick(event, self){
	event.stopPropagation();
	var id = $(self).parent().parent().attr("zan-price-id");
	var isdir = $(self).parent().parent().attr("zan-isdir");
	if (isdir === "true") editCategory(id);
	else editItem(id);
}

function delClick(event, self){
	event.stopPropagation();
	var id = $(self).parent().parent().attr("zan-price-id");
	$("#confirmMessageDelId").val(id);
	var name = $("[zan-price-id="+id+"]").text().trim();
	$(".delName").text(name);
	$("#confirmMessage").modal('show');
}

function addPrice(event, self){
	event.stopPropagation();
	var id = $(self).parent().parent().attr("zan-price-id");
	var isdir = $(self).parent().parent().attr("zan-isdir");
	if (isdir === "true"){
		$("#changeElementModalLabel").text(st("Добавление номенклатуры"));
		$("#changeElementFormName").val("");
		$("#changeElementFormDesc").val("");
		$("#changeElementFormNameLangs").val("{}");
		$("#changeElementFormDescLangs").val("{}");
		$("#changeElementFormCost").val("");
		$("#changeElementFormCount").val("");
		$("#changeElementFormId").val("");
		
		document.getElementById('changeElementFormFresh').checked = false;
		document.getElementById('changeElementFormActive').checked = true;
		var url = [];
		$.zan.curmedia = [];
		$.zan.curfolder = id;
		$("#changePriceFormImgs, #remImgs").html("");
		if (url.length!==0){
			for (var i = 0; i < url.length; i++)
				setimg($("#changePriceFormImgs"), url[i], "");
			$(".selbtn").hide();
		}
		else {
			$(".selbtn").show();
		}
		
		$("#changeElement").modal();
	}
}

function addFolder(event, self){
	event.stopPropagation();
	var id = $(self).parent().parent().attr("zan-price-id");
	var isdir = $(self).parent().parent().attr("zan-isdir");
	if (isdir === "true"){
		$.zan.curfolder = id;
		$("#changePriceModalLabel").text(st("Добавление папки"));
		$("#changeFolderFormName").val("");
		$("#changeFolderFormDesc").val("");
		$("#changeFolderFormNameLangs").val("{}");
		$("#changeFolderFormDescLangs").val("{}");
		$("#changeFolderFormId").val("");
		$("#changeFolder").modal();
	}
}

function removeFilesToDirId(dirid){
	//Удаляем все файлы в папке c dirid
	dpd.price.get({"parent":dirid}, function(response, err){
		for (var i = 0; i < response.length; i++) {
			dpd.price.del(response[i].id);
		}
	});
}

function removeFolder(tre){
	removeFilesToDirId(tre.id);
	if (tre.children.length!==0)
		removeFormTree(tre.children, 0, true);
}

function removeFormTree(tre, id, dfind){
	//Рекурсивное удаление всех подпапок папки с id
	if (dfind){
		for (var i = 0; i < tre.length; i++) removeFolder(tre[i]);
	}
	else
	for (var i = 0; i < tre.length; i++){
		if (tre[i].id === id) {
			removeFolder(tre[i]);
			tre.splice(i,1);
			return;
		}
		else{
			if (tre[i].children.length!==0)
				removeFormTree(tre[i].children, id, false);
		}
	}
}

function saveTree(){
	dpd.pricetree.put($.zan.tree.id, {tree:$.zan.tree.tree});
}

function removeFromUrl(url){
	url = clearUrl(url).replace("_small","");
	dpd.file.get({url:url}, function (f, e){
		if (e) return console.log(e);
		if (f.length<2){
			var sp = url.split("/");
			var fname = sp[sp.length-1];
			var dir = sp[sp.length-2];
			dpd.s3bucket.del(dir+"/"+fname);
			dpd.s3bucket.del(dir+"/"+fname+"_small");
		}
		dpd.file.get({cafe:$.zan.cafe, url:url}, function (r,e){
			if (!e && r.length!==0) dpd.file.del(r[0].id);
		});
	});
}

function clearUrl(url){
	var q = url.indexOf("?");
	if (q < 0) return url;
	return url.substr(0, q);
}

function getTree(tre, dirid){
	if (dirid==="0") return tre;//Функция поиска по дереву
	for (i in tre){
		if (tre[i].id == dirid) return tre[i];
		if (tre[i].children != undefined) {
			var t = getTree(tre[i].children, dirid);
			if (t != undefined) return t;
		}
	}
	return undefined;
}