class Cell_factory {
  constructor(element_tag, config) {
    this.element_tag = element_tag;
    //assigns all key:value pairs to properties of object
    //Usage: {type = "input", name = "name", id = "cool_beans"}
    Object.assign(this, config);

    //make "input" elements have a name
    if (this.element_tag == "input" && !this.hasOwnProperty("name")) {
      throw new Error('Cell factorys for inputs require a "name" property.')
    }
    
    //move this to Table_body_factory?
    //make all cells with same name are accessible as NodeList
    if (this.hasOwnProperty('name')) {
      if (this.name.slice(-2) != "[]"){
        this.name = this.name + "[]";
      }
    }
  }

  parse_input() {
    if (!(this.element_tag == "input")) {
      console.log("Trying to parse input from a non-input cell element", this.name);
      return;
    }
    const node_list = document.querySelectorAll(`input[name="${this.name}"]`);
    const values = [];
    if (this.type == "checkbox"){
      node_list.forEach(element => {
        values.push(element.checked);
      })
    } else {
      node_list.forEach(element => {
        values.push(element.value);
      })
    }
    return values;
  }

}
class Build_fully_defined_table {
  constructor(table_body_id, object, ordered_keys) {
    this.el = document.getElementById(table_body_id);
    this.object = object;
    this.ordered_keys = ordered_keys;
  }
  build_table() {
    this.el.innerHTML = "";
    for (let key of this.ordered_keys){
      this.add_row(this.object[key]);
    }
  }
  add_row(cells) {
    //Each object has key:value pairs to describe
    //the attributes for each element. The length of the array
    //determines the number of 
    const assembled_row = this.el.insertRow(); // Insert a new row
    for (const cell of cells) {
      //if (!(cell instanceof Cell_factory)) {
      //  console.error(`${cell.constructor.name} given instead of Cell_factory object.`);
      //  continue;
      //}
      let new_cell = assembled_row.insertCell();
      let new_element =  document.createElement(cell.element_tag);
      for (const [key, value] of Object.entries(cell)) {
        //assign properties of cell factory to the html element itself
        //use keys such as name, id, type, class, etc.
        new_element[key] = value;
      }
      new_cell.appendChild(new_element);
    }
  }
}

class Input_table_factory extends Build_fully_defined_table {
  //rows: array or object of left column text labels or integer for number of rows
  //cell_factory_arr is an array of cell factories, to be repeated n_rows times
  constructor(table_body_id, rows, cell_factory_arr) {
    super();
    if (!(Array.isArray(cell_factory_arr))) {
      console.error("Input Error: Table body factory needs an array of Cell_factory objects");
      return;
    }
    this.columns = this.#deep_clone(cell_factory_arr);
    this.n_cols = this.columns.length;

    this.el = document.getElementById(table_body_id);

    if (Array.isArray(rows)) {
      console.log("rows is an array");
      this.n_rows = rows.length;
      this.texts = rows;
      this.ids = Array.from({ length: rows.length }, (_, i) => i); //returns [0, 1, 2... rows.length]
      this.left_cells = this.#create_left_cells();

    } else if (typeof rows == "number") {
      this.n_rows = parseInt(rows);

    } else {
      this.n_rows = Object.keys(rows).length;
      this.texts = Object.values(rows);
      this.ids = Object.keys(rows);
      this.left_cells = this.#create_left_cells();
    }
    this.#create_table();
  }

  #deep_clone(array) {
    let clone_army = [];
    for (let i = 0; i < array.length; i++) {
      let data = structuredClone(array[i]);
      data.name = data.name.replace("[]", `${i}[]`);
      let clone = new Cell_factory(data.element_tag, data);
      clone_army.push(clone);
    }
    return clone_army;
  }
  
  #create_table() {    
    if (this.hasOwnProperty("texts")) {
      this.#create_table_with_texts();
    } else {
      this.#create_table_without_texts();
    }
  }

  #create_table_without_texts() {
    console.log("creating table without texts.")
    for (let i = 0; i < this.n_rows; i++) {
      this.add_row(this.columns)
    }
  }

  #create_table_with_texts() {
    console.log("creating table with texts");
    for (let i = 0; i < this.n_rows; i++) {
      this.add_row([this.left_cells[i], ...this.columns]) //each text added just in time to row template
    }
  }

  #create_left_cells() {
    let cells = [];
    for (let i = 0; i < this.n_rows; i++) {
      const new_cell = new Cell_factory('text', {
        textContent: this.texts[i],
        id: this.ids[i],
      });
      cells.push(new_cell);
    }
    console.log("created left cells")
    return cells;
  }

  parse_inputs(by_row = false){
    //sometimes want by row,sometimes by column. 
    //take over naming of cell_factory object to assist with column row.
    
    //create long array of all inputs
    let output_array =[];    
    for (let i = 0; i < this.columns.length; i++) {
      output_array.push(...this.columns[i].parse_input());
    }

    //create long array, to show what group data belongs to
    //[a,a,a,a,b,b,b,b] or [a,b,a,b,a,b,a,b]
    let indices =[];
    if (by_row == true) {
      indices = this.#indices_for_rows(output_array);
    } else {
      indices = this.#indices_for_columns(output_array);
    }

    //assign data to task
    let output_object = {};
    for (let i=0; i < output_array.length; i++) {
      //this magic below creates new array or uses existing array if available
      (output_object[indices[i]] = output_object[indices[i]] || []).push(output_array[i]);
    }
    return output_object;
  }

  #indices_for_rows(long_array){
    console.log("by_row == true.")
    let indices_for_rows = [];
    for (let i = 0; i < long_array.length; i++){
      let index = this.ids[i%this.n_rows];
      indices_for_rows.push(index);
    }
    return indices_for_rows;
  }
  
  #indices_for_columns(long_array){
    console.log("by_row == false")
    let indices_for_columns = [];
    for (let i = 0; i < long_array.length; i++){
      let index = Math.floor(i / this.n_rows);
      indices_for_columns.push(index);
    }
    return indices_for_columns;
  }
}

class Text_cell{
  constructor (text, css_class_list) {
    this.text = text;
    this.style = css_class_list;
  return new Cell_factory('text', {
      type: 'text',
      textContent: this.text,
      classList: this.style,
    })
  }
}

const name_in = new Cell_factory("input", {
    type: "text",
    name: "name",
    value: "hsa",
})

const text_input = new Cell_factory('text', {
  textContent: "hi todd",
});

const num_in = new Cell_factory("input", {
  type: "number",
  name: "amount",
  min: 0,
  step: 0.01,
});

const percent_in = new Cell_factory("input", {
  type: "checkbox",
  name: "percent",
});

const pretax_in = new Cell_factory("input", {
    type: "checkbox",
    name: "pretax",
})

const rmv_row_btn = new Cell_factory("button",  {
  textContent: "Remove",
  onClick: "function () {assembled_row.remove();",
  name: "Remove",
  body: "Remove",
});
