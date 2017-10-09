(function(){
            'use strict';
            var Util = (function(){
                var prefix = "html5_reader_";
                var StorageGetter = function(key) {
                    return localStorage.getItem(prefix + key);
                };
                var StorageSetter = function(key,val) {
                    return localStorage.setItem(prefix+key,val);
                }
                var getJsonp = function(url,callback){
                    return $.jsonp({
                        url : url,
                        cache : true,
                        callback : 'duokan_fiction_chapter',
                        success : function(result){
                            var data = $.base64.decode(result);
                            var json = decodeURIComponent(escape(data));
                            callback(json);
                        }
                    });
                }
                return {
                    getJsonp : getJsonp,
                    StorageGetter:StorageGetter,
                    StorageSetter:StorageSetter
                }
            })();
                var Dom = {
                    top_nav:$("#top-nav"),
                    bottom_nav:$("#bottom-nav"),
                    font_container:$(".font_container"),
                    font_button:$(".font_button"),
                    neight_day_switch_button:$("#neight_day_switch_button")
                }
                var win = $(window);
                var doc = $(document);
                var body = $('body');
                var readerModel;
                var readerUI;
                var rootContainer = $("#fiction_container");
                var initFontSize = Util.StorageGetter('font-size');
                var initBackground = Util.StorageGetter('background');
                var initColor = Util.StorageGetter('color');
                var initInnerText = Util.StorageGetter('innerText');

                Dom.neight_day_switch_button[0].innerText = initInnerText;
                initFontSize = parseInt(initFontSize);
                if(!initFontSize){
                    initFontSize = 14;
                }
                if(!initBackground){
                    initBackground = 'rgb(140, 140, 140)';
                }
                if(initInnerText == '白天'){
                    rootContainer.css({
                        'font-size':initFontSize,
                        'background':initBackground,
                        'color':initColor
                    });
                    body.css('background',initBackground);
                }else {
                    rootContainer.css({
                        'font-size':initFontSize,
                        'background':initBackground,
                        'color':initColor
                    });
                    body.css('background',initBackground);
                }

                function main(){
                    //todo 整个项目的 入口函数
                    EventHanlder();
                    setBackground();
                    switchNeightOrDay();
                    setFontSize();
                    readerModel = ReaderModel();
                    readerUI = ReaderBaseFrame(rootContainer);
                    readerModel.init(function(data){
                        readerUI(data) ;
                    });
                }


                function ReaderModel(){
                    var Chapter_id;
                    var ChapterTotal;
                    var init = function(UIcallback){
                        getFictionInfoPromise().then(function(d){
                           return getCurChapterContentPromise();
                        }).then(function(d){
                            UIcallback && UIcallback(d);
                        })
                    }
                     var getFictionInfoPromise = function(){
                        return new Promise(function(resolve,reject){
                        $.getJSON('data/chapter.json',function(data) {
                            //todo 获得章节信息之后的回调
                            if(data.result == 0){
                                Chapter_id = Util.StorageGetter('last_chapter_id');
                                if(Chapter_id == null){
                                    Chapter_id = data.chapters[1].chapter_id;
                                }
                                ChapterTotal = data.chapters.length;
                                resolve();
                            }else{
                                reject();
                            }
                            },'json');
                        });
                    }

                    var getCurChapterContentPromise = function(){
                        return new Promise(function(resolve,reject){
                        $.getJSON('data/data'+Chapter_id+'.json',function(data){
                            if(data.result == 0){
                                var url = data.jsonp;
                                // console.log(url);
                                Util.getJsonp(url,function(data){
                                    resolve(data);
                                });
                            }else {
                                reject({'msg':'fail'});
                            }
                        },'json');
                    });
                }
                    var prevChapter = function(UIcallback){
                        Chapter_id = parseInt(Chapter_id,10);
                        if(Chapter_id == 0){
                            return;
                        }
                         Chapter_id -= 1;
                        getCurChapterContent(Chapter_id,UIcallback);
                        Util.StorageSetter('last_chapter_id',Chapter_id);
                    }

                    var nextChapter = function(UIcallback){
                        Chapter_id = parseInt(Chapter_id,10);
                        if(Chapter_id == ChapterTotal){
                            return;
                        }
                         Chapter_id += 1;
                        getCurChapterContent(Chapter_id,UIcallback);
                        Util.StorageSetter('last_chapter_id',Chapter_id);
                    }
                    return {
                        init:init,
                        prevChapter : prevChapter,
                        nextChapter : nextChapter
                    }
                }

                function ReaderBaseFrame(container){
                    //todo 渲染基本的UI结构
                    function parseChapterData(jsonData){
                        var jsonObj = JSON.parse(jsonData);
                        var html = '<h4>' + jsonObj.t + '</h4>';
                        for(var i = 0 ;i<jsonObj.p.length;i++){
                            html += '<p>'+jsonObj.p[i]+'</p>';
                        }
                        return html;
                    }
                    return function(data){
                        container.html(parseChapterData(data));
                    }
                }

                function EventHanlder(){
                    //todo 交互事件的绑定
                    $("#action_mid").click(function(){
                        if(Dom.top_nav.css('display') == 'none'){
                            Dom.top_nav.show();
                            Dom.bottom_nav.show();
                        } else {
                            Dom.top_nav.hide();
                            Dom.bottom_nav.hide();
                            Dom.font_container.hide();
                        }
                    });

                    Dom.font_button.click(function(){
                        if(Dom.font_container.css('display') == 'none'){
                            Dom.font_container.show();
                            Dom.font_button.addClass('current');
                        }else {
                            Dom.font_container.hide();
                            Dom.font_button.removeClass('current');

                        }
                    });


                    win.scroll(function(event) {
                        Dom.top_nav.hide();
                        Dom.bottom_nav.hide();
                        Dom.font_container.hide();
                    });

                    $('#prev_button').click(function(){
                        //todo..获得章节翻页数据，然后渲染
                        readerModel.prevChapter(function(data){
                            readerUI(data)
                        });
                    });
                    $('#next_button').click(function(){
                        readerModel.nextChapter(function(data){
                            readerUI(data) ;
                        });
                    });
                }

                function setFontSize(){
                    $("#large-font").click(function(event){
                        if(initFontSize > 20){
                            return;
                        }
                        initFontSize += 1;
                        rootContainer.css('font-size',initFontSize);
                        Util.StorageSetter("font-size",initFontSize);
                    });

                    $("#small-font").click(function(event) {
                        if(initFontSize < 12){
                            return;
                        }
                        initFontSize -= 1;
                        rootContainer.css('font-size',initFontSize);
                        Util.StorageSetter("font-size",initFontSize);
                    });
                }

                function switchNeightOrDay(){
                    $('.neight_button').click(function(event) {
                            var that = Dom.neight_day_switch_button;
                            if(that[0].innerText == '夜间'){
                                that[0].innerText = '白天';
                                rootContainer.css({'background':'#b5eecd','color':'#414c41'});
                                body.css('background','#b5eecd');
                                Util.StorageSetter('background','#b5eecd');
                                Util.StorageSetter('color','#414c41');
                                Util.StorageSetter('innerText','白天');

                            }else {
                                that[0].innerText = '夜间';
                                rootContainer.css({'background':'#414441','color':'#d5cecd'});
                                body.css('background','#414441');
                                Util.StorageSetter('background','#414441');
                                Util.StorageSetter('color','#d5cecd');
                                Util.StorageSetter('innerText','夜间');
                            }
                        });
                }

                function setBackground(){
                    for(var i = 1;i <= $('.bk-container').length;i++){
                        $('#bk-container-'+i).click(function(event) {
                        body.css('background','none');
                        rootContainer.css('color','#414c41');
                        initBackground = this.style.background;
                        rootContainer.css("background",this.style.background);
                        body.css('background',this.style.background);
                        Util.StorageSetter('background',initBackground);
                        Util.StorageSetter('color','#414c41');
                    });
                    }
                }

                main();
        })();