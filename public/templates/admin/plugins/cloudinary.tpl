<h1>Cloudinary</h1>

<form class="form">
	<div class="row">
		<div class="col-sm-4 col-xs-12">
			<div class="form-group">
				<label>Cloud Name</label>
				<input id="cloud_name" type="text" class="form-control" placeholder="Enter your cloud name" value="{config.cloud_name}">
			</div>
			<div class="form-group">
				<label>API Key</label>
				<input id="api_key" type="text" class="form-control" placeholder="Enter your API key" value="{config.api_key}">
			</div>
			<div class="form-group">
				<label>API Secret</label>
				<input id="api_secret" type="text" class="form-control" placeholder="Enter your API secret" value="{config.api_secret}">
			</div>
            <div class="form-group">
                <label>Foler name</label>
                <input id="folder" type="text" class="form-control" placeholder="Enter folder name (optional)" value="{config.folder}">
            </div>
		</div>
	</div>
</form>

<button class="btn btn-primary" id="save">Save</button>

<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">


	$('#save').on('click', function() {

        var folder = $('#folder').val();

        if (folder.length) {

            if (folder.charAt(0) !== '/') {
                folder = '';
                app.alertError('Folder name needs start with /');
                return;
            }

        }
        $.ajax({
            url: config.relative_path + '/api/admin/plugins/cloudinary/save',
            method: 'POST',
            data: {
                _csrf : $('#csrf_token').val(),
                config: {
                    cloud_name : $('#cloud_name').val(),
                    api_key : $('#api_key').val(),
                    api_secret : $('#api_secret').val(),
                    folder : folder
                }
            },
            success: function(data){
                app.alertSuccess(data.message);
            },
            error: function(data) {
                app.alertError(JSON.parse(data.responseText).message);
            }
        })

		return false;
	});

</script>
