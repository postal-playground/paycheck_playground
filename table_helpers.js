class Element_factory {
  constructor(element_tag, config) {
    this.element_tag = element_tag;
    this.config = config;
    this.#input_elements_need_a_name();
  }
  
  #transfer_properties_to_element(element) {
    Object.assign(element, this.config);
  }
  
  create_element() {
    let new_element = document.createElement(this.element_tag);
    this.#transfer_properties_to_element(new_element);
    return new_element;
  }
  
  listify_name(){
    if (this.element_tag == "input" && this.config.hasOwnProperty('name')) {
      if (this.config.name.slice(-2) != "[]"){
        this.config.name = this.config.name + "[]";
      }
    }
  }

  #input_elements_need_a_name() {
    if (this.element_tag == "input" && !this.config.hasOwnProperty("name")) {
      throw new Error('Cell factories for inputs require a "name" property.');
    }
  }

  parse_input() {
    if (!(this.element_tag == "input")) {
      console.log("Trying to parse input from a non-input cell element", this.config.name);
      return;
    }
    const node_list = document.querySelectorAll(`input[name="${this.config.name}"]`);
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

class Text_cell{
  constructor (text, css_class_list) {
    this.text = text;
    this.style = css_class_list;
  return new Element_factory('text', {
      type: 'text',
      textContent: this.text,
      classList: this.style,
    })
  }
}

class Number_input {
  constructor(name, value, min, step = 0.01) {
    return new Element_factory('input', {
      type: "number",
      name: name,
      value: value,
      min: min,
      step: step
    });
  }
}

class Check_box {
  constructor(name, checked = false) {
    return new Element_factory('input', {
      type: "checkbox",
      name: name,
      checked: checked,
    });
  }
}

class Text_input {
  constructor(name, default_text) {
    return new Element_factory("input", {
      type: "text",
      name: name,
      value: default_text,
    });
  }
}


const rmv_row_btn = new Element_factory("button",  {
  textContent: "Remove",
  onClick: "function () {new_row.remove();",
  name: "Remove",
  body: "Remove",
});


class Select_box extends Element_factory{
  constructor(element_name, options_pairs, multiple = false) {
    super();
    this.keys_values = options_pairs;
    this.name = element_name;
    this.multiple = multiple;
    this.element = this.#create_select_box();
    this.#add_options_to_box(this.element);
  }

  #create_select_box() {
    const select_box = document.createElement('select');
    select_box.id = this.name;
    select_box.name = this.name;
    select_box.multiple = this.multiple;
    return select_box;
  }
  
  #add_options_to_box(select_box) {
    for (const [key, value] of Object.entries(this.keys_values)) {
      let option = document.createElement('option');
      option.value = key;
      option.textContent = value;
      option.selected = this.multiple;
      select_box.appendChild(option);
    }
  }
}

class Build_fully_defined_table {
  constructor(table_body_id, object, ordered_keys) {
    this.el = document.getElementById(table_body_id);
    this.object = object;
    this.ordered_keys = ordered_keys;
  }

  build_table() {
    this.el.innerHTML = ""; //resets table before adding new stuff
    for (let key of this.ordered_keys){
      this.add_row(this.object[key]);
    }
  }
  
  parse_inputs() {
    const inputElements = this.el.querySelectorAll('input, SELECT');
    const formData = {};
    for (const element of inputElements) {
      if (element.name) { // Ensure the element has a 'name' attribute
        if (element.type === 'checkbox') {
          formData[element.name] = element.checked;
        } else if (element.type === 'radio') {
          if (element.checked) {
            formData[element.name] = element.value;
          }
          } else if (element.tagName === "SELECT") {
            formData[element.name] = element.value;
          } else if (element.type !== 'submit' && element.type !== 'reset' && element.type !== 'button') {
            //formData[element.name] = element.value;
            (formData[element.name] = formData[element.name] || []).push(element.value);
    
        }
      }
    }
    console.log(formData);
    return formData;
  }
  
  add_row(columns_content) {
    //The length of the array determines the number of columns in each row
    const new_row = this.el.insertRow();
    for (const content of columns_content) {
      let new_col = new_row.insertCell();
      if (content.constructor.name == "Element_factory") {
        var child = content.create_element();
      } else {
        var child = content;
      }
      new_col.appendChild(child);
    }
  }
}

//TODO: rename this to a repeated elements table
class Input_table_factory extends Build_fully_defined_table {
  //rows: array or object of left column text labels or integer for number of rows
  //Element_factory_arr is an array of cell factories, to be repeated n_rows times
  constructor(table_body_id, rows, element_factory_arr) {
    super();
    this.#we_need_an_array(element_factory_arr);
    this.columns = this.#deep_clone(element_factory_arr);
    this.n_cols = this.columns.length;
    this.el = document.getElementById(table_body_id);
    
    if (Array.isArray(rows)) {
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

  #we_need_an_array(maybe_array) {
    if (!(Array.isArray(maybe_array))) {
      console.error("Input Error: Table body factory needs an array of element_factory objects");
      return;
    }
  }

   #deep_clone(array) {
     let clone_army = [];
     for (let i = 0; i < array.length; i++) {
       let data = structuredClone(array[i]);
       data.config.name = data.config.name + `${i}`;
       let clone = new Element_factory(data.element_tag, data.config);
       clone.listify_name();
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
    for (let i = 0; i < this.n_rows; i++) {
      this.add_row(this.columns)
    }
  }

  #create_table_with_texts() {
    for (let i = 0; i < this.n_rows; i++) {
      this.add_row([this.left_cells[i], ...this.columns]) //each text added just in time to row template
    }
  }

  #create_left_cells() {
    let cells = [];
    for (let i = 0; i < this.n_rows; i++) {
      const new_cell = new Element_factory('text', {
        textContent: this.texts[i],
        id: this.ids[i],
      });
      cells.push(new_cell);
    }
    return cells;
  }

  parse_inputs(by_row = false){
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
    let indices_for_rows = [];
    for (let i = 0; i < long_array.length; i++){
      let index = this.ids[i%this.n_rows];
      indices_for_rows.push(index);
    }
    return indices_for_rows;
  }
  
  #indices_for_columns(long_array){
    let indices_for_columns = [];
    for (let i = 0; i < long_array.length; i++){
      let index = Math.floor(i / this.n_rows);
      indices_for_columns.push(index);
    }
    return indices_for_columns;
  }
}
