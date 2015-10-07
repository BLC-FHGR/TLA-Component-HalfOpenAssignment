/* Copyright (c) 2015 Christian Glahn and HTW Chur, MIT License */
/*jslint white: true */
/*jslint vars: true */
/*jslint sloppy: true */
/*jslint browser: true */
/*jslint todo: true */
/*jslint unparam: true */
/*jslint bitwise: true*/
/*jslint plusplus: true*/

/*global $, jQuery, lrs*/

// TODO: implement RequireJS logic.
(function () {

    // ** LRS Interaction
    // ** Define Activity Verbs
    var Actions = {
        "main": "http://mobinaut.org/xapi/verb/creative/brainstormassign+state",
        "idea": "http://mobinaut.org/xapi/verb/creative/ideacontribute",
        "associate":  "http://mobinaut.org/xapi/verb/reflective/ideaassociate"
    };

    var jq = $ || jQuery;
//    var $;
//
//    if (!window.$ && window.jQuery) {
//        $ = window.jQuery;
//    }

    var itemlist = [],
        predef = {},
        bAssign = false,
        iReady = 0,
        bAdmin = false,
        bUser = false,
        result = {correcterms: 0,
                  ownterms: [],
                  association: {}};

    jq("#setterms").text(jq("#predefitems").children().length);

    jq(".predefineditem").each(function(i,e) {
        predef[e.textContent.toLowerCase()] = e.classList[1];
    });

    var dragitem, mainUUID;

    function displayPreviousAttempt() {
        function cbPrevData(aDoc) {
            // aDoc = aDoc.pop();

            if (aDoc) {
                jq("#warning-already-taken").removeClass("hidden");

                jq("#ownterms").text(aDoc.ownterms.length);
                jq("#corrterms").text(aDoc.correcterms);
                jq("#assign_finish").addClass("hidden");

                Object.getOwnPropertyNames(aDoc.association).forEach(function (e) {

                   aDoc.association[e].forEach(function (vo) {
                         var value = vo.value;
                        jq('<div>' + value + "</div>")
                            .addClass("itemstyle alert alert-info")
                            .appendTo("#"+ e +  "_list");
                    });
                });

                jq("#results").removeClass("hidden");
                jq("#assigndata").removeClass("hidden");
            }
            else {
                jq("#ideacollector").removeClass("hidden");

            }
        }

        // ** LRS Interaction
        // ** Phase X: Load Activity Stream
        var stream = lrs.getStream();
        var uuid = stream[0].id;

        lrs.fetchState(cbPrevData, document.location.href, uuid);

        // var li = jq('<div>' + value + "</div>").addClass("itemstyle alert alert-info");
    }

    function initAttempt() {
        if (!bAdmin && !bUser) {
            // show warning
             jq("#warning-no-privileges").removeClass("hidden");
        }
        else if (bUser) {

            // ** LRS Interaction
            // ** Phase 0: Check for Prior Actions

            var stream = lrs.getStream();
            if (stream.length) {
                // show warning
                displayPreviousAttempt();
            }
            else {
                // start activity
                jq("#ideacollector").removeClass("hidden");
            }
        }
        else if (bAdmin) {
            // TODO display stats

            // ** LRS Interaction
            // ** for teachers and tutors: display stats
            // TODO Load the Class Activity Stream from Moodle

            jq("#studentstats").removeClass("hidden");
        }

    }

    function cbStartDrag(e) {
        if (bAssign && e.target.nodeName.toLowerCase() === "div" &&
            jq(e.target).hasClass("itemstyle")) {
            e.target.setAttribute("draggable", "true");
        }
    }

    function cbDragStart(e) {
        //e.preventDefault();
        dragitem = jq(e.target);
        // detach the item from the list

        e.dataTransfer.setData('text', e.target.textContent);
        e.dataTransfer.effectAllowed = 'move';

    }

    function cbHideDrag(e) {
       //  jq("#dummyli").insertBefore(dragitem).removeClass("btn-warning inactive");
        dragitem.addClass("hidden");
    }

    function cbShowDrag(e) {
        if (dragitem) {
            dragitem.removeClass("hidden");
        }

        // jq("#dummyli").appendTo("#dnd_holder");
        if (!jq("#itemlist_list").children().length) {
            jq("#assign_ready").addClass("htwcblock");
        }
    }

    function addItem(value) {
        // NOW THE ACTION STARTS
        if (!mainUUID) {
            // ** LRS Interaction
            // ** Phase 1: Sanity CHeck

            // main action not started? Start a new one.
            mainUUID = lrs.startAction(Actions.main);
            lrs.startContext({"statement": mainUUID});
        }
        if (typeof value === "string") {
            // remove commas and semicolons
            value = value.replace(/\,\;/, "");
            value.trim();
            if (value.length) {
                if (itemlist.indexOf(value.toLowerCase()) < 0) {
                    itemlist.push(value);
                    var li = jq('<div>' + value + "</div>").addClass("itemstyle alert alert-info");
                    var ext = jq("<div/>").addClass("span4 row-fluid").css({'margin-left': 0, 'padding-left': '5px'});
                    ext.append(li);
                    li[0].addEventListener("dragstart", cbDragStart);
                    li.on("dragover", cbHideDrag);
                    li.on("dragend", cbShowDrag);
                    jq("#itemlist_list").append(ext);

                    // ** LRS Interaction
                    // ** Phase 1: Micro Action

                    lrs.recordAction(Actions.idea,
                                     {
                        extensions: {
                            "http://mobinaut.io/xapi/result/input": value
                        }
                    });
                }
            }
        }
    }

    function cbBlur(e) {
        switch(e.which) {
            case 0:                       // EOF
            case 13:                      // return
            case 17:                      // enter
            case 91:                      // num enter
            case 186:                     // semicolon
            case 188:                     // comma
                addItem(jq("#itemlist_new")[0].value);
                // jq("#itemlist_new").blur();
                jq("#itemlist_new")[0].value = "";
                break;
        }
    }

    function cbDragOver(e) {
        e.preventDefault();
        var t = jq(e.currentTarget);

        if (t.hasClass("alert-warning") ||
            t.hasClass("alert-danger") ||
            t.hasClass("alert-success")){

            var type = "warning",
                ltype = type;
            if (t.hasClass("alert-danger")) {
                type = "danger";
                ltype = "important";
            }
            if (jq(e.currentTarget).hasClass("alert-success")) {
                type = "success";
                ltype = type;
            }


            t
                .removeClass("alert-" + type)
                .addClass("label-" + ltype);
        }
        return false;
    }

    function cbDragOut(e) {
        e.preventDefault();
        var t = jq(e.currentTarget);

        if (t.hasClass("label-warning") ||
            t.hasClass("label-important") ||
            t.hasClass("label-success")){

            var type = "warning",
                ltype = type;

            if (t.hasClass("label-important")) {
                type = "danger";
                ltype = "important";
            }
            if (t.hasClass("label-success")) {
                type = "success";
                ltype = type;
            }

            t
                .addClass("alert-" + type)
                .removeClass("label-" + ltype);
        }

        return false;
    }

    function cbDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        var target =  e.currentTarget.id,
            value  = dragitem.text();

        dragitem.parent().detach();
        jq("#" + target + "_list").append(dragitem);
        dragitem.removeClass("hidden");
        dragitem[0].removeAttribute("draggable");
        dragitem = null;

        // ensure that the ready button only appears after the upper list is
        // empty
        if (!jq("#itemlist_list").children().length) {
            jq("#assign_finish").removeClass("hidden");
        }

        cbDragOut(e);

        // ** LRS Interaction
        // ** Phase 2: Micro Action

        lrs.recordAction(Actions.associate,
                         document.location.href,
                         {
                            extensions: {
                                "http://mobinaut.io/xapi/result/associate": [
                                    target,
                                    value
                                ]
                            }
        });

        return false;
    }

    // this function mixes the predefined questions before displaying them
    function shuffleArray(array) {
        var i, j, temp;
        for (i = array.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function cbCollectReady(e) {
        addItem(jq("#itemlist_new")[0].value);
        jq("#ideacollector, #assigndata").toggleClass("hidden");
        result.ownterms = itemlist;

        if (!mainUUID) {
            // main action not started, yet? Start a new one.

            // ** LRS Interaction
            // ** Phase 2: SANITY CHECK set main action context

            mainUUID = lrs.startAction(Actions.main,
                                       document.location.href);
            lrs.startContext({"statement": mainUUID});
        }

        // add additional items, if necessary
        shuffleArray(jq(".predefineditem")).each(function(i, e) {
            if (itemlist.indexOf(e.textContent) < 0) {
                var je = jq(e);
                e.addEventListener("dragstart", cbDragStart);

                je.addClass("itemstyle alert alert-info");

                 var ext = jq("<div/>").addClass("span4 row-fluid").css({'margin-left': 0, 'padding-left': '5px'});
                    ext.append(je);
                je.on("dragover", cbHideDrag)
                    .on("dragend", cbShowDrag);

                jq("#itemlist_list").append(ext);
            }
        });
        bAssign = true;
    }

    // calculate the student score
    function cbAssess() {
        jq("#ownterms").text(itemlist.length);

        var score = 0;
        jq(".droplist .itemstyle").each(function(i, e) {
            var id = e.parentElement.parentElement.id,
                vok = 0;
            if (!result.association.hasOwnProperty(id)) {
                result.association[id] = [];
            }
            if (predef[e.textContent.toLowerCase()] === id) {
                score++;
                vok = 1;
            }
            result.association[id].push({value: e.textContent,
                                         match: vok});
        });

        result.correcterms = score;

        jq("#corrterms").text(score);
        jq("#results").removeClass("hidden");
        jq("#assign_finish").addClass("hidden");
        bAssign = false;

        // ** LRS Interaction
        // ** Phase 2: END Main Action
        lrs.finishAction(mainUUID);

        // ** LRS Document API: use state API to keep the student's achievements
        lrs.setStateDoc(mainUUID, result);

        // ** LRS Interaction
        // ** Phase 2: PUSH the recorded actions towards Moodle
        lrs.push();
    }


    function cbAdminStream(ok) {
        iReady++;
        if (ok !== undefined) {
            bAdmin = true;
        }

        if (iReady > 1) {
            initAttempt();
        }
    }

    function cbMyStream(ok) {
        iReady++;
        if (ok !== undefined) {
            bUser = true;
        }
        if (iReady > 1) {
            initAttempt();
        }
    }

    // ** LRS Interaction
    // ** Phase 0: Connect with Moodle

    // Wait until the LRS interface is ready
    if (lrs) {
        lrs.ready(function() {
            lrs.fetchMyActions({verb: Actions.main,
                                object: document.location.href},
                               cbMyStream);

            lrs.fetchActions({verb: Actions.main,
                              object: document.location.href},
                             cbAdminStream);
        });
    }


    // register the callbacks
    jq("#itemlist_new").keyup(cbBlur);
    jq("#itemlist_list, #block1, #block2, #block3").mousedown(cbStartDrag);

    jq(".dropblock")
        .on('dragover', cbDragOver)
        .on('dragleave',cbDragOut)
        .on('drop', cbDrop);

    jq("#itemlist_ready").click(cbCollectReady);
    jq("#assign_ready").click(cbAssess);
}());
