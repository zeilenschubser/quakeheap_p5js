/****
	Quake Heap implementation
	LICENSE: GPLv3
  Author: zeilenschubser@gmail.com
  github.com/zeilenschubser
  
  Changelog:
    - implemented basic drawing
    
  TODO:
    - implement earthquake
    - fix bugs
***/

var layerHeight = 40;
var circleRadius = 20;
var circle_distance = 20;

var sum = (arr) => arr.reduce((a, b) => a + b, 0);

let QuakeHeap = class {
  constructor() {
    this.trees = []
  }
  createNode(x, nodes) {
    //console.log("createNode", x, nodes);
    return {
      element: x,
      nodes: nodes,
      height: max(nodes.map(x => x.height + 1).concat([0]))
    };
  }
  insert(x) {
    this.trees.push(this.createNode(x, []));
  }
  consolidate(tree1, tree2) {
    //we cant that easily consolidate two trees
    //they must be the same height!
    var new_tree = this.createNode(min(tree1.element, tree2.element), [tree1, tree2]);
    //console.log(new_tree);
    this.trees.push(new_tree);
  }
  deletePath( node, element) {
  		//debugger;
    	node.nodes.forEach(node_x => {
      	if(node_x.element == element)
        {
        	//delete path
          this.deletePath(node_x, element);
        }
        else{
        	this.trees.push(node_x);
        }
      });
  }
  deleteMin() {
    console.log("deleteMin");
    //find the minimum among all roots
    var treeRoots = this.trees.map(tree => tree.element);
    var trimIdx = treeRoots.indexOf(min(treeRoots));
    //debugger;
    this.deletePath(this.trees.splice(trimIdx, 1)[0], treeRoots[trimIdx]);
    //trim tree
    //consolidate the trees: while there are two trees of the same height: link the two trees
    var max_height = Math.ceil(Math.log2(sum(this.trees.map(tree => pow(2, tree.height))))) + 1;
    var trees_of_height = (height) => this.trees.filter(x => x.height == height);
    for (var height = 0; height < max_height; height++) {
      for (var trees_of_height_x = trees_of_height(height); 
              trees_of_height_x.length > 1; 
              trees_of_height_x = trees_of_height(height)
              ) {
      	//debugger;
        try {
          console.log("consolidate", height, trees_of_height_x.length);
          var tree1 = this.trees.splice(this.trees.indexOf(trees_of_height_x[0]), 1)[0];
          //we removed one already, so to make sure idxs are in order
          //we just ask again for the index
          var tree2 = this.trees.splice(this.trees.indexOf(trees_of_height_x[1]), 1)[0];
          this.consolidate(tree1, tree2);
        } catch (error) {
					console.log(error);
          break
        }

      }
    }
    //earthquake
    if(0){}
  }
  decreaseKey(x, k) {
    //find the highest node v that stores x
    //if v is the root: decrease the key to k
    //if v is not the root: cut v and decrease the key to k in the seperate tree
    //do bfs

    var change_element_in_children = (node, x, k) => {
      node.element = k;
      node.nodes.forEach(node_x => {
        if (node_x.element == x) {
          node_x.element = k;
          change_element_in_children(node_x, x, k);
        }
      });
    };
		
    var unexplored_nodes = this.trees.map(x => [x, null]);
    while (unexplored_nodes.length > 0) {
      var node_and_parent = unexplored_nodes.splice(0, 1)[0];
      var node = node_and_parent[0];
      var parent = node_and_parent[1];
      if (node.element == x) {
        //we found it: decrease key
        if (parent == null) { //this is a root node
          change_element_in_children(node, x, k);
        } else {
          var index = parent.nodes.indexOf(node);
          var new_subtree = parent.nodes.splice(index, 1)[0];
          change_element_in_children(new_subtree, x, k);
          this.trees.push(new_subtree);

        }
        break;
      } else if (node.nodes.length > 0) { //add subnodes
        node.nodes.forEach(x => unexplored_nodes.push([x, node]));
      }
    }
  }
};
var heap = new QuakeHeap();

function drawNode(x, y, elem) {
  fill(255, 255);
  circle(x, y, circleRadius);
  textSize(12);
  color(255, 255, 0);
  fill(0, 255);
  text(elem, x - 4 - (3 * (("" + elem).length - 1)), y + 4);
}

function drawBox(x, y, sizex, sizey) {
  fill(255, 0);
  color(255, 0, 0);
  rect(x, y, sizex, sizey);
  color(0, 0, 0);
  fill(255, 255);
}

function drawLine(x, y, tx, ty) {
  fill(255, 255);
  color(255, 0, 0);
  line(x, y, tx, ty);
}


class tree_drawer {
  constructor(tree) {
    this.tree = tree;
    this.tree_drawers = tree.nodes.map(node => new tree_drawer(node));
  }
  draw(left_x) {
    var max_x = left_x;
    var drawing_info = this.tree_drawers.map((drawer, index) => {
      var ret = {};
      if (index == 0) {
        ret = drawer.draw(left_x);
        max_x = max(max_x, ret.max_x);
      } else {
        var left_pos = max_x + circleRadius;

        ret = drawer.draw(left_pos);
        max_x = max(max_x, ret.max_x);
      }
      return ret;
    });
    var min_x = min([left_x].concat(drawing_info.map(x => x.min_x)));
    var max_x = max([left_x + circleRadius].concat(drawing_info.map(x => x.max_x)));

    var y = layerHeight * this.tree.height + circleRadius;
    var x = min_x + (max_x - min_x) / 2;
    var w = 5;
    var h = layerHeight;

    //drawBox(x-0.5*w, height-y-0.5*h, w, h);
    if (this.tree.height > 0) {
      var child_y = layerHeight * (this.tree.height - 1) + circleRadius;
      drawing_info.every(result => {
        var dx = result.x - x;
        var dy = result.y - y;
        var angle = atan(dx / dy);
        var old_length = Math.sqrt(dx * dx + dy * dy);
        var new_length = old_length - 0.5 * circleRadius;
        var new_x1 = x - new_length * sin(angle);
        var new_y = y - new_length * cos(angle);
        drawLine(x, height - y, new_x1, height - new_y);
        //drawLine(x,height-y, new_x2, height - new_y);
        return true;
      });
    }
    //draw the node over the line
    drawNode(x, height - y, this.tree.element);
    //console.log(`drawing ${this.tree.element} @ height=${this.tree.height} at x=${x} (leftx=${left_x}), y=${y}, drawing_info.length=${drawing_info.length}`);

    return {
      min_x: min_x,
      max_x: max(x, max_x),
      x: x,
      y: y,
    };
  }
  get_size_x() {
    if (this.tree.height == 0) return circleRadius;
    //console.log(`get_size_x ${this.tree.element} @ height=${this.tree.height} = ${max([60].concat(this.tree_drawers.map(x => x.get_size_x())))}`);
    return max([0].concat(this.tree_drawers.map(x => x.size_x)));
  }
};

function render() {
  background(220);
  var xLastTree = circle_distance;
  heap.trees.every(tree => {
    var drawer = new tree_drawer(tree);
    xLastTree = drawer.draw(xLastTree).max_x + circleRadius;
    return true;
  });
}


function setup() {
  console.clear();
  createCanvas(700, 200);
  frameRate(1);
  heap.trees = [
    heap.createNode(4, [ //level 4
      heap.createNode(51, [ //level 3
        heap.createNode(51, [ //level 2
          heap.createNode(51, [ //level 1
            heap.createNode(68, []), //level 0
            heap.createNode(51, []), //level 0
          ]),
        ]),
      ]),
      heap.createNode(4, [ //level 3
        heap.createNode(4, [ //level 2
          heap.createNode(4, [ //level 1
            heap.createNode(4, []), //level 0
          ]),
          heap.createNode(22, [ //level 1
            heap.createNode(22, []), //level 0
          ]),
        ]),
        heap.createNode(7, [ //level 2
          heap.createNode(7, [ //level 1
            heap.createNode(7, []), //level 0
            heap.createNode(92, []), //level 0
          ]),
          heap.createNode(19, [ //level 1
            heap.createNode(19, []), //level 0
            heap.createNode(90, []), //level 0
          ]),
        ]),
      ]),
    ]),
    heap.createNode(17, []),
    heap.createNode(38, []),
    heap.createNode(10, [
      heap.createNode(10, []),
      heap.createNode(37, [])
    ]),
    heap.createNode(2, [
      heap.createNode(11, [
        heap.createNode(44, []),
        heap.createNode(11, [])
      ]),
      heap.createNode(2, [
        heap.createNode(52, []),
        heap.createNode(2, [])
      ]),
    ]),
  ];
  render();
  if (1) {
    heap.decreaseKey(7, 3);
    render();
    heap.deleteMin();
    render();
    heap.insert(1);
    render();
  }
}

function draw() {}
