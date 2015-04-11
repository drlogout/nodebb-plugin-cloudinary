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
                <div class="checkbox">
                    <label>
                        <input id="delete_on_purge" type="checkbox" value="deleteOnPurge" {deleteOnPurge}> Delete cloudinary images on post purge
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Cloudinary upload options in JSON format</label>
                <textarea id="options" class="form-control" rows="6">{options}</textarea>
            </div>
            <p>e.g.
                <code>
                    {
                        "folder": "/folder-name"
                    }
                </code>
            </p>
            <p>Documentation: <a href="http://cloudinary.com/documentation/node_image_upload#all_upload_options" target="_blank">http://cloudinary.com/documentation/node_image_upload#all_upload_options</a></p>
		</div>
	</div>
</form>

<button class="btn btn-primary" id="save">Save</button>

<input id="csrf_token" type="hidden" value="{csrf}" />

<script type="text/javascript">


	$('#save').on('click', function() {

        var options;

        if ($('#options').val() === '') {
            options = {};
        } else {
            try {
                options = JSON.parse($('#options').val());
            } catch (e) {
                app.alertError('No valid JSON');
                options = {};
                return;
            }
        }

        $.ajax({
            url: config.relative_path + '/api/admin/plugins/cloudinary/save',
            method: 'POST',
            data: {
                _csrf : $('#csrf_token').val(),
                cloudinarySettings: {
                    config: {
                        cloud_name : $('#cloud_name').val(),
                        api_key : $('#api_key').val(),
                        api_secret : $('#api_secret').val(),
                    },
                    options: options,
                    deleteOnPurge: $('#delete_on_purge').is(':checked')
                }
            },
            success: function(data){
                app.alertSuccess(data.message);
            },
            error: function(data) {
                app.alertError(JSON.parse(data.responseText).message);
            }
        });

		return false;
	});

</script>
