(function() {
  var Gun = typeof window !== "undefined" ? window.Gun : require("gun");

  Gun.on("opt", function(ctx) {
    this.to.next(ctx);
    var opt = ctx.opt;
    console.log("opt.pid::" + JSON.stringify(opt));
    if (ctx.once) {
      return;
    }
    opt.file = String(opt.file || "data.json");
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

    ctx.on("get", function(at) {
      // this.to.next(at); //What does this do?
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
  });
})();
