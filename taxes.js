const fed_tax_rates =[0, 0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
const fed_mfj_brackets_standard = [17100, 40950, 114050, 223800, 411700, 518150, 768700, 202154.5]
const fed_mfj_brackets_multiple = [15000, 26925, 63475, 118350, 212300, 265525, 390800]
const fed_hoh_brackets_standard =[13900, 30900, 78750, 117250, 211200, 264400, 640250, 187031.5]
const fed_mfs_brackets_standard =[6400, 18325, 54875, 109750, 203700, 256925, 632750, 188769.75]
const fed_single_brackets_standard =[6400, 18325, 54875, 109750, 203700, 256925, 632750, 188769.75]
const fed_hoh_brackets_multiple =[0, 17000, 64850, 103350, 197300, 250500, 626350]
const fed_mfs_brackets_multiple =[0, 11925, 48475, 103350, 197300, 250525, 375800]
const fed_single_brackets_multiple =[0, 11925, 48475, 103350, 197300, 250525, 375800]






class w4 {
    constructor (data_obj) {
        this.box_1c = data_obj.filing_status;
        this.box_2 = data_obj.multiple_jobs;
        this.box_3 = parseInt(data_obj.credits[0]);
        this.box_4a = parseInt(data_obj.other_income[0]);
        this.box_4b = parseInt(data_obj.deductions[0]);
        this.box_4c = parseInt(data_obj.extra_withholdings[0]);
    }
}

class withholdings_worksheet_1a { // from publication 15T
    constructor (w4_instance, taxable_wages, pay_periods_per_year = 26){
        this.w4 = w4_instance;
        this.line_1a = parseInt(taxable_wages);
        this.line_1b = parseInt(pay_periods_per_year);
    }
    
    #line_1c() {
        return this.line_1a * this.line_1b;
    }
    #line_1d() {
        return this.w4.box_4a;
    }
    #line_1e() {
        return this.#line_1c() + this.#line_1d();
    }
    #line_1f() {
        return this.w4.box_4b;
    }

    #line_1g() {
        var mult_job_cred = 8600;
        if (this.w4.box_2) {
            mult_job_cred = 0;
        } else if (this.w4.box_1c == "MFJ") {
            mult_job_cred = 12900; 
        }
        return mult_job_cred
    }

    #line_1h() {
        return this.#line_1f() + this.#line_1g();
    }

    #line_1i() {
        return this.#line_1e() - this.#line_1h();
    }

    #line_2a() {// same as 1i, but assuming we have a recent w4
        console.log("2A", this.#line_1i())
        return Math.max(this.#line_1i(), 0);
    }

    #line_2h() { //equivalent to method in publication, but calculates column c on the fly
        let brackets = [];
        if (w4.box_2 == true) {
            switch (this.w4.box_1c) {
                case 'MFJ':
                    brackets = fed_mfj_brackets_multiple;
                    break;  
                case 'MFS':
                    brackets = fed_mfs_brackets_multiple;
                    break;
                case 'Single':
                    brackets = fed_single_brackets_multiple;
                    break;
                case 'HoH':
                    brackets = fed_hoh_brackets_multiple;
                    break;
            }
        } else {    
            switch (this.w4.box_1c) {
                case 'MFJ':
                    brackets = fed_mfj_brackets_standard;
                    break;  
                case 'MFS':
                    brackets = fed_mfs_brackets_standard;
                    break;
                case 'Single':
                    brackets = fed_single_brackets_standard;
                    break;
                case 'HoH':
                    brackets = fed_hoh_brackets_standard;
                    break;
            }
        }
        var prev_bracket = 0;
        var tentative_annual_tax = 0;
        var marginal_tax = 0;
        var adjusted_annual_wage = this.#line_2a();
        for (let i=0; i < fed_tax_rates.length; i++) {
            if (adjusted_annual_wage > brackets[i]) {
                marginal_tax = (brackets[i] - prev_bracket)*fed_tax_rates[i];
                tentative_annual_tax = tentative_annual_tax + marginal_tax;
                prev_bracket = brackets[i];
                console.log(tentative_annual_tax, marginal_tax)
            } else {
                tentative_annual_tax = tentative_annual_tax + (adjusted_annual_wage - prev_bracket)*fed_tax_rates[i];
                console.log(tentative_annual_tax, marginal_tax)
                break;
            }
        }
        var tentative_witholding = tentative_annual_tax / this.line_1b;
        console.log("2h", tentative_witholding)
        return tentative_witholding;
    }

        
    #line_3a() {
        return Math.max(this.w4.box_3, 0);
    }
    
    #line_3b() {
        return this.#line_3a() / this.line_1b; 
    }

    #line_3c() {
        return Math.max(this.#line_2h() - this.#line_3b(), 0);
    }

    #line_4a() {
        return this.w4.box_4c;
    }

    #line_4b() {
        return this.#line_3c() + this.#line_4a();
    }

    fed_income_tax() {
        return this.#line_4b();
    }
}



if (typeof window !== 'undefined') {
    const filing_status_options = {'MFJ':'Married Filing Jointly', 'Single':'Single', 'MFS':"Married Filing Separately", 'HoH':"Head of Household"};
    const filing_status_select = new Select_box("filing_status", filing_status_options);
    const multiple_jobs = new Element_factory("input", {
    type: "checkbox",
    name: "multiple_jobs",
    });
    const w4_order = ['status', 'multiple_jobs', 'credits', 'other_income', 'deductions', 'extra_withholdings'];
    const w4_table_elements = {'status':[new Text_cell("Filing Status (Box 1c)", "left-column-text"), filing_status_select.element],
            'multiple_jobs':[new Text_cell("Multiple Jobs (Box 2)", "left-column-text"), multiple_jobs], 
            'credits':[new Text_cell("Credits (Box 3)", "left-column-text"), new Number_input("credits", 0, 0, 1)], 
            'other_income':[new Text_cell("Other Income (Box 4a)", "left-column-text"), new Number_input("other_income", 0, 0, 1)],
            'deductions':[new Text_cell("Deductions (Box 4b)", "left-column-text"), new Number_input("deductions", 0, 0, 1)],
            'extra_withholdings':[new Text_cell("Extra Withholding (Box 4c)", "left-column-text"), new Number_input("extra_withholdings", 0, 0, 1)]
        }
        
    const w4_input_table = new Build_fully_defined_table("w4-input-table", w4_table_elements, w4_order);
    w4_input_table.build_table();
    const submit_w4_button =  document.getElementById('submit-w4-button');
    if (submit_w4_button) {
        submit_w4_button.addEventListener('click', event =>{
            event.preventDefault(); // Prevent default form submission

            console.log("button pressed for w4");
            w4_inputs = new w4(w4_input_table.parse_inputs());
            console.log(w4_inputs);

            withholdings = new withholdings_worksheet_1a(w4_inputs, window.taxable_income, 26);
            // but we don't want gross income, we want taxable income here (above).
            window.federal_withholdings  = withholdings.fed_income_tax();
            open_page('deductions');
        })
    }
} else {
    w4_inputs = {
        filing_status: 'MFJ',
        multiple_jobs: false,
        credits: [8000],
        other_income: [0],
        deductions: [0],
        extra_withholdings: [0],
    }
    w4 = new w4(w4_inputs);
    withholdings = new withholdings_worksheet_1a(w4, 3176, 26);
    fed_withholding = withholdings.fed_income_tax();
    console.log("Fed income tax", fed_withholding)
}
