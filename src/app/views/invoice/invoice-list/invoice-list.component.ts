import { Component, OnInit } from '@angular/core';
import { DataLayerService } from 'src/app/shared/services/data-layer.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-invoice-list',
    templateUrl: './invoice-list.component.html',
    styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
    invoices: any[]=[]

    constructor(
        private dl: DataLayerService,
        private modalService: NgbModal,
        private toastr: ToastrService,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        this.loadInvoices()
    }
    loadInvoices() {
        this.dl.getInvoices()
            .subscribe(res => {
                this.invoices = res;
            })
    }

    deleteInvoice(id, modal) {
        this.modalService.open(modal, { ariaLabelledBy: 'modal-basic-title', centered: true })
            .result.then((result) => {
                this.dl.deleteInvoice(id)
                    .subscribe(res => {
                        this.toastr.success('Invoice Deleted!', this.translate.instant("toaster_Heading_Success"), { timeOut: 3000 });
                        this.loadInvoices();
                    })
            }, (reason) => {
            });
    }

}
