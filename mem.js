(function() {
  var Gun = typeof window !== "undefined" ? window.Gun : Gun ? Gun : require("gun/gun");
  Gun.on('opt', function(ctx){
	this.to.next(ctx);
	var opt = ctx.opt;
	//if(ctx.once){ return }
	
	var graph = ctx.graph, acks = {}, count = 0, to;
	var disk = {};
	
    ctx.on("put", function(at) {
      this.to.next(at);
      Gun.graph.is(at.put, null, null);
      if (!at["@"]) {
        acks[at["#"]] = true;
      } // only ack non-acks.
      count += 1;
      if (count >= (opt.batch || 10000)) {
        return flush();
      }
      if (to) {
        return;
      }
      to = setTimeout(flush, opt.wait || 1);
     // var id = at['#']
     // ctx.on('in', {"@": id, ok:1})
    });
	ctx.on('get', function(at){
                //console.log("get at",at,disk);
		this.to.next(at);
		var lex = at.get, soul, data, opt, u;
		//setTimeout(function(){
		if(!lex || !(soul = lex['#'])){console.log("solex",soul,lex['#']); return }
		//if(0 >= at.cap){ return }
		var field = lex['.'];
		data = disk[soul] || u;
		if(data && field){
			data = Gun.state.to(data, field);
		}
		ctx.on('in', {'@': at['#'], put: Gun.graph.node(data)});
		//},11);
	});

	var map = function(val, key, node, soul){
		disk[soul] = Gun.state.to(node, key, disk[soul]);
	}

	var wait;
	var flush = function(){
                //console.log("flushing",to);
		if(wait){ return }
		wait = true;
		clearTimeout(to);
		to = false;
		var ack = acks;
		acks = {};
			wait = false;
			var tmp = count;
			count = 0;
                        console.log("ack",ack);
			Gun.obj.map(ack, function(yes, id){
                        
				ctx.on('in', {
					'@': id,
					err: 0,
					ok: 1 // lel, hacks
				});
			});
			if(1 < tmp){ flush() }
		
	}
});
/*  Gun.on("opt", function(ctx) {
    this.to.next(ctx);
    var opt = ctx.opt;
    if (ctx.once) {
      return;
    }
    
    var graph = ctx.graph,
      acks = {},
      count = 0,
      to;

    ctx.on("put", function(at) {
      this.to.next(at);
      Gun.graph.is(at.put, null, null);
      if (!at["@"]) {
        acks[at["#"]] = true;
      } // only ack non-acks.
      count += 1;
      if (count >= (opt.batch || 10000)) {
        return flush();
      }
      if (to) {
        return;
      }
      to = setTimeout(flush, opt.wait || 1);
    });
    ctx.on("put", function(at) {
      this.to.next(at);
      Gun.graph.is(at.put, null, null);
      if (!at["@"]) {
        acks[at["#"]] = true;
      } // only ack non-acks.
      count += 1;
      if (count >= (opt.batch || 10000)) {
        return flush();
      }
      if (to) {
        return;
      }
      to = setTimeout(flush, opt.wait || 1);
      var id = at['#']
      ctx.on('in', {"@": id, ok:1})
    });
    ctx.on("get", function(at) {
      this.to.next(at); //What does this do?
      var lex = at.get,
        soul,
        data,
        opt,
        u;

      if (!lex || !(soul = lex["#"])) {
        return;
      }
      var field = lex["."];
      if (data && field) {
        data = Gun.state.to(data, field);
      }
      ctx.on("in", { "@": at["#"], put: Gun.graph.node(data) });
    });

    var wait;
    var flush = function() {
      if (wait) {
        return;
      }
      wait = true;
      clearTimeout(to);
      to = false;
      var ack = acks;
      acks = {};
    };
  });*/
})();
