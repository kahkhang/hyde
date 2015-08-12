L.Control.Search = L.Control.extend({
  options: {
    // topright, topleft, bottomleft, bottomright
    position: 'topleft',
    placeholder: 'Search...'
  },
  initialize: function (args) {
    // constructor
    
    this.arguments = [];
    for(var i = 0; i < args.length-1; i++)
      this.arguments.push(args[i]);
    //console.log(this.arguments);
    L.Util.setOptions(this, args[args.length-1]);
  },
  onAdd: function (map) {
    var that = this;
    // happens after added to map
    //top: -65px; left: 40px
    var container = L.DomUtil.create('div', '');
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "50px";
    this.typeahead = L.DomUtil.create('input', 'typeahead tt-input', container);
    this.typeahead.id = "tagsInput";
    this.typeahead.type = 'text';
    this.typeahead.placeholder = this.options.placeholder;
    this.typeahead["data-role"] = "tagsinput";
    $(this.typeahead).tagsinput({
      typeaheadjs: this.arguments[1]
    });
    $(this.typeahead).on('itemAdded', function(event) {
      isSelected[event.item] = true;
      reloadLayers();
      updateWordCloudColors();
    });
    $(this.typeahead).on('itemRemoved', function(event) {
      isSelected[event.item] = false;
      reloadLayers();
      updateWordCloudColors();
    });
    //$(this.typeahead).typeahead.apply($(this.typeahead),this.arguments);
    ["typeahead:active", "typeahead:idle", "typeahead:open", "typeahead:close", 
     "typeahead:change", "typeahead:render", "typeahead:select", 
     "typeahead:autocomplete", "typeahead:cursorchange", 
     "typeahead:asyncrequest", "typeahead:asynccancel", 
     "typeahead:asyncreceive"].forEach(function(method){
       if(that.options[method]){
         $(that.typeahead).bind(method, that.options[method]);
       }
    });
    L.DomEvent.disableClickPropagation(container);
    return container;
  },
  onRemove: function (map) {
  },
  keyup: function(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      // do nothing
    } else {
    }
  },
  itemSelected: function(e) {
    L.DomEvent.preventDefault(e);
  },
  submit: function(e) {
    L.DomEvent.preventDefault(e);
  }
});
 
L.control.typeahead = function(args) {
  return new L.Control.Search(arguments);
}